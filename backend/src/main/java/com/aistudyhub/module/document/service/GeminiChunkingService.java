package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.config.ChunkConfig;
import com.aistudyhub.config.GeminiConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

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
                JsonNode response = webClient.post()
                        .uri(geminiConfig.getApiUrl())
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(buildRequestBody(segment, targetChunkSize, overlap))
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .timeout(Duration.ofSeconds(geminiConfig.getTimeout()))
                        .block();

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
            log.error("Gemini API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackToLocal(rawText, requestedChunkSize, requestedOverlap,
                    "Gemini API error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Gemini chunking failed", e);
            return fallbackToLocal(rawText, requestedChunkSize, requestedOverlap,
                    "Gemini chunking failed: " + e.getMessage());
        }
    }

    private WebClient buildWebClient() {
        return webClientBuilder
                .defaultHeader("x-goog-api-key", geminiConfig.getApiKey())
                .build();
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

    public record ChunkingOutcome(
            List<TextChunkingService.ChunkResult> chunks,
            ChunkingStrategy strategy,
            String detail) {
    }
}
