package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.config.ChunkConfig;
import com.aistudyhub.config.GeminiConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.Semaphore;
import java.util.stream.Stream;

/**
 * Semantic chunking bằng Google Gemini.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiChunkingService {

    public enum ChunkingStrategy {
        GEMINI_SEMANTIC,
        LOCAL_HEURISTIC_FALLBACK
    }

    private final GeminiConfig geminiConfig;
    private final ChunkConfig chunkConfig;
    private final TextChunkingService fallbackChunkingService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final Semaphore geminiRequestSemaphore = new Semaphore(1);
    private long lastGeminiRequestStartedAt = 0L;

    public List<TextChunkingService.ChunkResult> chunkText(
            String rawText,
            Integer requestedChunkSize,
            Integer requestedOverlap) {
        return chunkTextWithMetadata(rawText, requestedChunkSize, requestedOverlap).chunks();
    }

    public ChunkingOutcome chunkTextWithMetadata(
            String rawText,
            Integer requestedChunkSize,
            Integer requestedOverlap) {

        if (rawText == null || rawText.isBlank()) {
            return new ChunkingOutcome(List.of(), ChunkingStrategy.LOCAL_HEURISTIC_FALLBACK,
                    "Input text is empty");
        }
        if (geminiConfig.getApiKey() == null || geminiConfig.getApiKey().isBlank()) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Missing GEMINI_API_KEY. Semantic chunking cannot run without Gemini credentials.");
        }

        int targetChunkSize = resolveChunkSize(requestedChunkSize);
        int overlap = resolveOverlap(requestedOverlap, targetChunkSize);

        try {
            WebClient webClient = buildWebClient();
            List<TextChunkingService.ChunkResult> results = new ArrayList<>();
            int index = 0;
            List<String> segments = splitIntoGeminiInputs(rawText);

            for (String segment : segments) {
                JsonNode response = postGeminiWithRetry(
                        webClient,
                        buildRequestBody(segment, targetChunkSize, overlap),
                        "semantic chunking");

                List<GeminiChunkDto> parsedChunks = parseChunks(response);
                for (GeminiChunkDto chunk : parsedChunks) {
                    String textContent = chunk.textContent() == null ? "" : chunk.textContent().trim();
                    if (textContent.isEmpty()) {
                        continue;
                    }
                    results.add(new TextChunkingService.ChunkResult(
                            index++,
                            textContent,
                            estimateTokens(textContent),
                            chunk.sourcePage(),
                            normalizeSection(chunk.sourceSection()),
                            null
                    ));
                }
            }

            if (results.isEmpty()) {
                throw new AppException(ErrorCode.GEMINI_EMPTY_RESPONSE,
                        "Gemini response was parsed successfully but contained no non-empty chunks.");
            }
            if (results.size() > chunkConfig.getMaxChunksPerDoc()) {
                throw new AppException(ErrorCode.TOO_MANY_CHUNKS,
                        "Gemini produced " + results.size() + " chunks, exceeding limit "
                                + chunkConfig.getMaxChunksPerDoc());
            }

            log.info("Gemini semantic chunking created {} chunks across {} request(s)",
                    results.size(), segments.size());
            return new ChunkingOutcome(results, ChunkingStrategy.GEMINI_SEMANTIC,
                    "Gemini semantic chunking completed successfully");

        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.GEMINI_CHUNKING_FAILED
                    || e.getErrorCode() == ErrorCode.GEMINI_EMPTY_RESPONSE) {
                return fallbackToLocal(rawText, requestedChunkSize, requestedOverlap, e.getMessage());
            }
            throw e;
        } catch (WebClientResponseException.Unauthorized e) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini authentication failed. Please verify GEMINI_API_KEY.");
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().isSameCodeAs(HttpStatus.TOO_MANY_REQUESTS)) {
                throw new AppException(ErrorCode.GEMINI_RATE_LIMITED,
                        "Gemini is currently rate-limited for document semantic chunking. Please wait a minute and try again.");
            }
            log.error("Gemini API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackToLocal(rawText, requestedChunkSize, requestedOverlap,
                    "Gemini API error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Gemini chunking failed", e);
            return fallbackToLocal(rawText, requestedChunkSize, requestedOverlap,
                    "Gemini chunking failed: " + e.getMessage());
        }
    }

    public ModeratedChunkingOutcome chunkTextWithSafetyReview(
            String rawText,
            Integer requestedChunkSize,
            Integer requestedOverlap) {

        if (rawText == null || rawText.isBlank()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT);
        }
        if (geminiConfig.getApiKey() == null || geminiConfig.getApiKey().isBlank()) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Missing GEMINI_API_KEY. Document safety review cannot run without Gemini credentials.");
        }

        int targetChunkSize = resolveChunkSize(requestedChunkSize);
        int overlap = resolveOverlap(requestedOverlap, targetChunkSize);

        try {
            WebClient webClient = buildWebClient();
            List<TextChunkingService.ChunkResult> results = new ArrayList<>();
            List<SafetyReview> safetyReviews = new ArrayList<>();
            int index = 0;
            List<String> segments = splitIntoGeminiInputs(rawText);

            for (String segment : segments) {
                JsonNode response = postGeminiWithRetry(
                        webClient,
                        buildSafetyReviewRequestBody(segment, targetChunkSize, overlap),
                        "safety review");

                GeminiModeratedResponse parsed = parseModeratedResponse(response);
                safetyReviews.add(toSafetyReview(parsed.moderation()));

                if (parsed.chunks() != null) {
                    for (GeminiChunkDto chunk : parsed.chunks()) {
                        String textContent = chunk.textContent() == null ? "" : chunk.textContent().trim();
                        if (textContent.isEmpty()) {
                            continue;
                        }
                        results.add(new TextChunkingService.ChunkResult(
                                index++,
                                textContent,
                                estimateTokens(textContent),
                                chunk.sourcePage(),
                                normalizeSection(chunk.sourceSection()),
                                null
                        ));
                    }
                }
            }

            if (safetyReviews.isEmpty()) {
                throw new AppException(ErrorCode.GEMINI_EMPTY_RESPONSE,
                        "Gemini returned no moderation verdict.");
            }
            SafetyReview combinedReview = combineSafetyReviews(safetyReviews);
            if (results.isEmpty() && combinedReview.safe()) {
                throw new AppException(ErrorCode.GEMINI_EMPTY_RESPONSE,
                        "Gemini safety review response contained no non-empty chunks.");
            }
            if (results.size() > chunkConfig.getMaxChunksPerDoc()) {
                throw new AppException(ErrorCode.TOO_MANY_CHUNKS,
                        "Gemini produced " + results.size() + " chunks, exceeding limit "
                                + chunkConfig.getMaxChunksPerDoc());
            }

            log.info("Gemini safety review completed: chunks={}, segments={}, safe={}, severity={}, category={}",
                    results.size(), segments.size(), combinedReview.safe(), combinedReview.severity(),
                    combinedReview.category());

            return new ModeratedChunkingOutcome(
                    results,
                    ChunkingStrategy.GEMINI_SEMANTIC,
                    "Gemini safety review and semantic chunking completed successfully",
                    combinedReview);
        } catch (AppException e) {
            throw e;
        } catch (WebClientResponseException.Unauthorized e) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini authentication failed. Please verify GEMINI_API_KEY.");
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().isSameCodeAs(HttpStatus.TOO_MANY_REQUESTS)) {
                throw new AppException(ErrorCode.GEMINI_RATE_LIMITED,
                        "Gemini is currently rate-limited for document safety review. Please wait a minute and try again.");
            }
            log.error("Gemini safety review API error: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini safety review failed: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Gemini safety review failed", e);
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini safety review failed: " + e.getMessage());
        }
    }

    private WebClient buildWebClient() {
        return webClientBuilder
                .defaultHeader("x-goog-api-key", geminiConfig.getApiKey())
                .build();
    }

    private JsonNode postGeminiWithRetry(WebClient webClient, Object requestBody, String operation) {
        int maxAttempts = Math.max(1, geminiConfig.getMaxRetries());
        WebClientResponseException.TooManyRequests lastRateLimit = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return postGeminiOnce(webClient, requestBody);
            } catch (WebClientResponseException.TooManyRequests e) {
                lastRateLimit = e;
                if (attempt >= maxAttempts) {
                    break;
                }
                long delayMillis = resolveRetryDelayMillis(e, attempt);
                log.warn("Gemini {} hit rate limit on attempt {}/{}. Retrying after {} ms.",
                        operation, attempt, maxAttempts, delayMillis);
                sleepBeforeRetry(delayMillis);
            }
        }

        String retryAfter = lastRateLimit != null
                ? lastRateLimit.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)
                : null;
        String retryHint = retryAfter == null || retryAfter.isBlank()
                ? "Please wait a minute and try again."
                : "Please wait " + retryAfter + " seconds and try again.";
        throw new AppException(ErrorCode.GEMINI_RATE_LIMITED,
                "Gemini is currently rate-limited for document " + operation + ". " + retryHint);
    }

    private JsonNode postGeminiOnce(WebClient webClient, Object requestBody) {
        boolean acquired = false;
        try {
            geminiRequestSemaphore.acquire();
            acquired = true;
            enforceMinimumRequestInterval();
            lastGeminiRequestStartedAt = System.currentTimeMillis();

            return webClient.post()
                    .uri(geminiConfig.getApiUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(geminiConfig.getTimeout()))
                    .block();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini request was interrupted before it could be sent.");
        } finally {
            if (acquired) {
                geminiRequestSemaphore.release();
            }
        }
    }

    private void enforceMinimumRequestInterval() throws InterruptedException {
        long minInterval = Math.max(0L, geminiConfig.getMinRequestIntervalMs());
        if (minInterval == 0L || lastGeminiRequestStartedAt == 0L) {
            return;
        }
        long elapsed = System.currentTimeMillis() - lastGeminiRequestStartedAt;
        long remaining = minInterval - elapsed;
        if (remaining > 0L) {
            Thread.sleep(remaining);
        }
    }

    private long resolveRetryDelayMillis(WebClientResponseException.TooManyRequests exception, int attempt) {
        String retryAfter = exception.getHeaders().getFirst(HttpHeaders.RETRY_AFTER);
        if (retryAfter != null && !retryAfter.isBlank()) {
            try {
                return Math.min(Long.parseLong(retryAfter.trim()) * 1000L, 60_000L);
            } catch (NumberFormatException ignored) {
                // Use exponential backoff when Retry-After is not numeric.
            }
        }
        long baseDelay = Math.max(500L, geminiConfig.getRetryInitialDelayMs());
        long exponentialDelay = baseDelay * (1L << Math.min(Math.max(attempt - 1, 0), 5));
        return Math.min(exponentialDelay, 30_000L);
    }

    private void sleepBeforeRetry(long delayMillis) {
        try {
            Thread.sleep(Math.max(0L, delayMillis));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.GEMINI_RATE_LIMITED,
                    "Gemini retry was interrupted. Please try again later.");
        }
    }

    private Object buildRequestBody(String rawText, int targetChunkSize, int overlap) {
        String prompt = """
                You are a document chunking engine for RAG.
                Split the provided document into semantically coherent chunks.

                Rules:
                - Return ONLY a valid JSON array.
                - Each array item must be an object with keys:
                  textContent (string), sourcePage (number or null), sourceSection (string or null)
                - Keep each chunk around %d characters when possible.
                - Preserve meaning; do not summarize or rewrite facts.
                - Use page/section hints from markers like [[PAGE:n]] and [[SECTION:name]].
                - If overlap is helpful, keep roughly %d characters of context between neighboring chunks.
                - Do not include markdown fences or explanations.

                Document:
                %s
                """.formatted(targetChunkSize, overlap, rawText);

        return java.util.Map.of(
                "contents", List.of(java.util.Map.of(
                        "parts", List.of(java.util.Map.of("text", prompt))
                )),
                "generationConfig", java.util.Map.of(
                        "temperature", geminiConfig.getTemperature()
                )
        );
    }

    private Object buildSafetyReviewRequestBody(String rawText, int targetChunkSize, int overlap) {
        String prompt = """
                You are a strict document safety moderation and RAG chunking engine for AI Study Hub,
                an educational platform used by students in Vietnam.

                Your task has two parts:
                1. Review whether the document segment is safe to store, download, share publicly,
                   or publish to a learning marketplace.
                2. Split the same document segment into semantically coherent chunks for RAG.

                Safety policy:
                - Flag content that appears to violate Vietnamese law or promotes illegal activity.
                - Flag instructions, guides, transactions, recruitment, or promotion related to:
                  illegal drugs, gambling/betting, prostitution/sexual exploitation, weapons or explosives,
                  evading law enforcement, fraud/scams, identity theft, financial crime, malware/cyber abuse,
                  terrorism/extremism, organized crime, serious violence, self-harm encouragement,
                  sexual content involving minors, doxxing/personal data leaks, or hate/harassment targeting protected groups.
                - Flag documents that mainly help users cheat exams, forge certificates, falsify school records,
                  or bypass university systems.
                - Do NOT flag neutral educational, historical, legal, medical, cybersecurity defensive,
                  or policy discussion content when it does not provide actionable illegal instructions.
                - When uncertain, choose REVIEW_REQUIRED style reasoning by using safe=false with severity=MEDIUM
                  only if the risk is concrete; avoid overblocking ordinary academic material.

                Severity guide:
                - NONE: safe ordinary educational content.
                - LOW: mild policy concern but still safe because context is clearly educational/neutral.
                - MEDIUM: concrete risky content or uncertain legal/safety concern; should not be shared automatically.
                - HIGH: clearly illegal/harmful actionable content; block and penalize.
                - CRITICAL: severe illegal content, sexual exploitation of minors, terrorism, weapons/explosives,
                  major cyber abuse, or direct incitement; block and account may be banned.

                Return ONLY one valid JSON object in this exact shape:
                {
                  "moderation": {
                    "safe": true,
                    "severity": "NONE",
                    "category": "NONE",
                    "confidence": 0.0,
                    "reason": "short reason",
                    "policyFlags": []
                  },
                  "chunks": [
                    {"textContent": "string", "sourcePage": 1, "sourceSection": "string or null"}
                  ]
                }

                Chunking rules:
                - Keep each chunk around %d characters when possible.
                - Preserve meaning; do not summarize or rewrite facts.
                - Use page/section hints from markers like [[PAGE:n]] and [[SECTION:name]].
                - If overlap is helpful, keep roughly %d characters of context between neighboring chunks.
                - Do not include markdown fences or explanations.

                Document segment:
                %s
                """.formatted(targetChunkSize, overlap, rawText);

        return java.util.Map.of(
                "contents", List.of(java.util.Map.of(
                        "parts", List.of(java.util.Map.of("text", prompt))
                )),
                "generationConfig", java.util.Map.of(
                        "temperature", Math.min(geminiConfig.getTemperature(), 0.1)
                )
        );
    }

    private List<GeminiChunkDto> parseChunks(JsonNode response) throws Exception {
        JsonNode textNode = response.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new AppException(ErrorCode.GEMINI_EMPTY_RESPONSE,
                    "Gemini returned an empty content payload.");
        }

        String raw = textNode.asText().trim();
        String json = extractJsonArray(raw);
        return objectMapper.readValue(json, new TypeReference<>() {
        });
    }

    private GeminiModeratedResponse parseModeratedResponse(JsonNode response) throws Exception {
        JsonNode textNode = response.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new AppException(ErrorCode.GEMINI_EMPTY_RESPONSE,
                    "Gemini returned an empty safety review payload.");
        }

        String raw = textNode.asText().trim();
        String json = extractJsonObject(raw);
        GeminiModeratedResponse parsed = objectMapper.readValue(json, GeminiModeratedResponse.class);
        if (parsed == null || parsed.moderation() == null) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini safety review payload is missing moderation.");
        }
        return parsed;
    }

    private String extractJsonArray(String raw) {
        String normalized = raw
                .replace("```json", "")
                .replace("```", "")
                .trim();

        int start = normalized.indexOf('[');
        int end = normalized.lastIndexOf(']');
        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini response does not contain a valid JSON array.");
        }
        return normalized.substring(start, end + 1);
    }

    private String extractJsonObject(String raw) {
        String normalized = raw
                .replace("```json", "")
                .replace("```", "")
                .trim();

        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end < start) {
            throw new AppException(ErrorCode.GEMINI_CHUNKING_FAILED,
                    "Gemini response does not contain a valid JSON object.");
        }
        return normalized.substring(start, end + 1);
    }

    private int resolveChunkSize(Integer requestedChunkSize) {
        if (requestedChunkSize == null || requestedChunkSize < 50) {
            return chunkConfig.getChunkSize();
        }
        return requestedChunkSize;
    }

    private int resolveOverlap(Integer requestedOverlap, int chunkSize) {
        int fallbackOverlap = Math.min(chunkConfig.getOverlap(), Math.max(0, chunkSize - 1));
        if (requestedOverlap == null || requestedOverlap < 0) {
            return fallbackOverlap;
        }
        return Math.min(requestedOverlap, Math.max(0, chunkSize - 1));
    }

    private int estimateTokens(String content) {
        return Math.max(1, (int) Math.ceil(content.length() / 4.0));
    }

    private List<String> splitIntoGeminiInputs(String rawText) {
        int maxInputChars = Math.max(2000, chunkConfig.getGeminiMaxInputChars());
        if (rawText.length() <= maxInputChars) {
            return List.of(rawText);
        }

        List<String> segments = new ArrayList<>();
        String[] paragraphs = rawText.split("\\R\\s*\\R");
        StringBuilder current = new StringBuilder();

        for (String paragraph : paragraphs) {
            String normalizedParagraph = paragraph == null ? "" : paragraph.trim();
            if (normalizedParagraph.isEmpty()) {
                continue;
            }

            if (normalizedParagraph.length() > maxInputChars) {
                flushCurrentSegment(segments, current);
                segments.addAll(splitLargeParagraph(normalizedParagraph, maxInputChars));
                continue;
            }

            int candidateLength = current.isEmpty()
                    ? normalizedParagraph.length()
                    : current.length() + 2 + normalizedParagraph.length();

            if (candidateLength > maxInputChars) {
                flushCurrentSegment(segments, current);
            }

            if (!current.isEmpty()) {
                current.append(System.lineSeparator()).append(System.lineSeparator());
            }
            current.append(normalizedParagraph);
        }

        flushCurrentSegment(segments, current);
        return segments.isEmpty() ? List.of(rawText) : segments;
    }

    private void flushCurrentSegment(List<String> segments, StringBuilder current) {
        if (!current.isEmpty()) {
            segments.add(current.toString());
            current.setLength(0);
        }
    }

    private List<String> splitLargeParagraph(String paragraph, int maxInputChars) {
        List<String> segments = new ArrayList<>();
        int start = 0;
        while (start < paragraph.length()) {
            int end = Math.min(paragraph.length(), start + maxInputChars);
            segments.add(paragraph.substring(start, end));
            start = end;
        }
        return segments;
    }

    private String normalizeSection(String section) {
        if (section == null || section.isBlank()) {
            return null;
        }
        return section.trim();
    }

    private SafetyReview toSafetyReview(GeminiModerationDto moderation) {
        DocumentViolationSeverity severity = parseSeverity(moderation.severity(), moderation.safe());
        List<String> policyFlags = moderation.policyFlags() == null
                ? List.of()
                : moderation.policyFlags().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(flag -> !flag.isBlank())
                .distinct()
                .toList();

        boolean safe = Boolean.TRUE.equals(moderation.safe())
                && (severity == DocumentViolationSeverity.NONE || severity == DocumentViolationSeverity.LOW);
        return new SafetyReview(
                safe,
                severity,
                normalizeModerationText(moderation.category(), "NONE"),
                clampConfidence(moderation.confidence()),
                normalizeModerationText(moderation.reason(), "Gemini did not provide a reason."),
                policyFlags
        );
    }

    private SafetyReview combineSafetyReviews(List<SafetyReview> reviews) {
        SafetyReview highest = reviews.stream()
                .max((left, right) -> Integer.compare(severityRank(left.severity()), severityRank(right.severity())))
                .orElse(new SafetyReview(false, DocumentViolationSeverity.HIGH, "UNKNOWN", 0.0,
                        "No safety review was produced.", List.of("MISSING_REVIEW")));
        boolean safe = reviews.stream().allMatch(SafetyReview::safe)
                && severityRank(highest.severity()) <= severityRank(DocumentViolationSeverity.LOW);
        List<String> flags = reviews.stream()
                .flatMap(review -> review.policyFlags() == null ? Stream.empty() : review.policyFlags().stream())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        String reason = reviews.stream()
                .filter(review -> review.severity() == highest.severity())
                .map(SafetyReview::reason)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(highest.reason());

        return new SafetyReview(safe, highest.severity(), highest.category(), highest.confidence(), reason, flags);
    }

    private DocumentViolationSeverity parseSeverity(String rawSeverity, Boolean safe) {
        if (rawSeverity == null || rawSeverity.isBlank()) {
            return Boolean.TRUE.equals(safe) ? DocumentViolationSeverity.NONE : DocumentViolationSeverity.HIGH;
        }
        try {
            return DocumentViolationSeverity.valueOf(rawSeverity.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Boolean.TRUE.equals(safe) ? DocumentViolationSeverity.NONE : DocumentViolationSeverity.HIGH;
        }
    }

    private int severityRank(DocumentViolationSeverity severity) {
        if (severity == null) {
            return severityRank(DocumentViolationSeverity.HIGH);
        }
        return switch (severity) {
            case NONE -> 0;
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 4;
        };
    }

    private double clampConfidence(Double confidence) {
        if (confidence == null || confidence.isNaN() || confidence.isInfinite()) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(1.0, confidence));
    }

    private String normalizeModerationText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private ChunkingOutcome fallbackToLocal(
            String rawText,
            Integer requestedChunkSize,
            Integer requestedOverlap,
            String reason) {
        List<TextChunkingService.ChunkResult> fallbackChunks =
                fallbackChunkingService.chunkText(rawText, requestedChunkSize, requestedOverlap);
        log.warn("Gemini semantic chunking unavailable, switched to local heuristic chunking: {}", reason);
        log.info("Local heuristic chunking created {} chunks as fallback", fallbackChunks.size());
        return new ChunkingOutcome(
                fallbackChunks,
                ChunkingStrategy.LOCAL_HEURISTIC_FALLBACK,
                reason
        );
    }

    private record GeminiChunkDto(String textContent, Integer sourcePage, String sourceSection) {
    }

    private record GeminiModerationDto(
            Boolean safe,
            String severity,
            String category,
            Double confidence,
            String reason,
            List<String> policyFlags) {
    }

    private record GeminiModeratedResponse(
            GeminiModerationDto moderation,
            List<GeminiChunkDto> chunks) {
    }

    public record SafetyReview(
            boolean safe,
            DocumentViolationSeverity severity,
            String category,
            double confidence,
            String reason,
            List<String> policyFlags) {
    }

    public record ChunkingOutcome(
            List<TextChunkingService.ChunkResult> chunks,
            ChunkingStrategy strategy,
            String detail) {
    }

    public record ModeratedChunkingOutcome(
            List<TextChunkingService.ChunkResult> chunks,
            ChunkingStrategy strategy,
            String detail,
            SafetyReview safetyReview) {
    }
}
