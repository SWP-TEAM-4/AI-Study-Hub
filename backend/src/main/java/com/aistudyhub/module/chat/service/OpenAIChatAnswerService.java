package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.config.OpenAIConfig;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Calls OpenAI Responses API to turn retrieved notebook chunks into a grounded answer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIChatAnswerService {

    private static final int MAX_CONTEXT_CHUNKS = 5;

    private final OpenAIConfig openAIConfig;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public String generateAnswer(String question, List<DocumentChunkResponse> relevantChunks) {
        if (question == null || question.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Question content must not be blank.");
        }
        if (relevantChunks == null || relevantChunks.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Relevant chunks are required to generate an answer.");
        }
        if (openAIConfig.getApiKey() == null || openAIConfig.getApiKey().isBlank()) {
            throw new AppException(ErrorCode.OPENAI_AUTH_FAILED,
                    "Missing OPENAI_API_KEY. Chat answer generation cannot run without OpenAI credentials.");
        }

        try {
            WebClient webClient = buildWebClient();
            HttpResponsePayload payload = webClient.post()
                    .uri("/responses")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestPayload(question, relevantChunks))
                    .exchangeToMono(response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(body -> new HttpResponsePayload(response.statusCode(), body)))
                    .timeout(Duration.ofSeconds(openAIConfig.getTimeout()))
                    .block();

            if (payload == null) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "OpenAI responses request returned no HTTP payload.");
            }
            if (!payload.statusCode().is2xxSuccessful()) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "OpenAI API error: " + formatOpenAiError(payload.statusCode(), payload.body()));
            }
            if (payload.body() == null || payload.body().isBlank()) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "OpenAI returned an empty response body.");
            }

            return extractAnswerText(objectMapper.readTree(payload.body()));
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OpenAI chat answer generation failed", ex);
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "OpenAI chat answer generation failed: " + ex.getMessage());
        }
    }

    private WebClient buildWebClient() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs()
                        .maxInMemorySize(openAIConfig.getMaxInMemoryBytes()))
                .build();

        return webClientBuilder
                .baseUrl(openAIConfig.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + openAIConfig.getApiKey())
                .exchangeStrategies(strategies)
                .build();
    }

    private Map<String, Object> buildRequestPayload(String question, List<DocumentChunkResponse> relevantChunks) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", openAIConfig.getModel());
        payload.put("instructions", """
                You are the AI Study Hub notebook assistant.
                Answer only from the provided notebook context.
                If the context is insufficient, say so clearly and suggest the user upload or attach more relevant documents.
                Keep the answer concise, helpful, and grounded in the retrieved material.
                Do not fabricate facts, quotes, or citations that are not supported by the context.
                """.strip());
        payload.put("input", buildUserPrompt(question, relevantChunks));
        return payload;
    }

    private String buildUserPrompt(String question, List<DocumentChunkResponse> relevantChunks) {
        StringBuilder builder = new StringBuilder();
        builder.append("User question:\n")
                .append(question.trim())
                .append("\n\nNotebook context:\n");

        relevantChunks.stream()
                .limit(MAX_CONTEXT_CHUNKS)
                .forEach(chunk -> builder.append(formatChunk(chunk)));

        builder.append("\nWrite the answer in Vietnamese. When useful, mention which document or page the answer came from in natural language.");
        return builder.toString();
    }

    private String formatChunk(DocumentChunkResponse chunk) {
        StringBuilder builder = new StringBuilder();
        builder.append("---\n")
                .append("Document: ").append(defaultText(chunk.getDocumentTitle(), "Untitled document")).append('\n')
                .append("Document ID: ").append(chunk.getDocumentId()).append('\n')
                .append("Chunk Index: ").append(chunk.getChunkIndex()).append('\n');

        if (chunk.getSourcePage() != null) {
            builder.append("Page: ").append(chunk.getSourcePage()).append('\n');
        }
        if (chunk.getSourceSection() != null && !chunk.getSourceSection().isBlank()) {
            builder.append("Section: ").append(chunk.getSourceSection().trim()).append('\n');
        }

        builder.append("Content:\n")
                .append(defaultText(normalizeWhitespace(chunk.getTextContent()), "(empty chunk)"))
                .append("\n");
        return builder.toString();
    }

    private String extractAnswerText(JsonNode root) {
        JsonNode outputNode = root.path("output");
        if (!outputNode.isArray() || outputNode.isEmpty()) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "OpenAI response did not contain any output.");
        }

        StringBuilder builder = new StringBuilder();
        for (JsonNode item : outputNode) {
            JsonNode contentNode = item.path("content");
            if (!contentNode.isArray()) {
                continue;
            }

            for (JsonNode contentItem : contentNode) {
                if (!"output_text".equals(contentItem.path("type").asText())) {
                    continue;
                }

                String text = contentItem.path("text").asText("");
                if (!text.isBlank()) {
                    if (builder.length() > 0) {
                        builder.append("\n\n");
                    }
                    builder.append(text.trim());
                }
            }
        }

        if (builder.length() == 0) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "OpenAI response did not contain assistant text output.");
        }

        return builder.toString();
    }

    private String formatOpenAiError(HttpStatusCode statusCode, String responseBody) {
        String detail = extractOpenAiErrorMessage(responseBody);
        if (detail == null || detail.isBlank()) {
            return statusCode.toString();
        }
        return statusCode + " - " + detail;
    }

    private String extractOpenAiErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorNode = root.path("error");
            if (errorNode.isMissingNode() || errorNode.isNull()) {
                return null;
            }

            String message = errorNode.path("message").asText(null);
            if (message != null && !message.isBlank()) {
                return message;
            }

            String code = errorNode.path("code").asText(null);
            String type = errorNode.path("type").asText(null);
            if (code != null && type != null) {
                return type + " (" + code + ")";
            }
            return code != null ? code : type;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeWhitespace(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record HttpResponsePayload(HttpStatusCode statusCode, String body) {
    }
}
