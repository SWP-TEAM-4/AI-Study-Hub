package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.config.OpenAIConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sinh embeddings qua OpenAI embeddings API.
 * Lưu ý: vector embedding không dùng chat GPT endpoint mà dùng endpoint embeddings của OpenAI.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIEmbeddingService {

    private final OpenAIConfig openAIConfig;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public Map<Integer, EmbeddingResult> generateBatchEmbeddings(Long documentId, List<String> chunkTexts) {
        if (chunkTexts == null || chunkTexts.isEmpty()) {
            return Map.of();
        }
        if (openAIConfig.getApiKey() == null || openAIConfig.getApiKey().isBlank()) {
            throw new AppException(ErrorCode.OPENAI_AUTH_FAILED,
                    "Missing OPENAI_API_KEY. Embedding generation cannot run without OpenAI credentials.");
        }

        try {
            WebClient webClient = buildWebClient();

            int batchSize = Math.max(1, openAIConfig.getEmbeddingBatchSize());
            Map<Integer, EmbeddingResult> result = new LinkedHashMap<>();

            for (int batchStart = 0; batchStart < chunkTexts.size(); batchStart += batchSize) {
                int batchEnd = Math.min(chunkTexts.size(), batchStart + batchSize);
                List<String> batchInputs = chunkTexts.subList(batchStart, batchEnd);
                JsonNode response = requestEmbeddings(webClient, batchInputs);
                JsonNode dataNode = response.path("data");

                if (!dataNode.isArray() || dataNode.isEmpty()) {
                    throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                            "OpenAI returned no embeddings for batch starting at index " + batchStart + ".");
                }

                List<JsonNode> items = new ArrayList<>();
                dataNode.forEach(items::add);
                items.sort(Comparator.comparingInt(node -> node.path("index").asInt()));

                for (JsonNode item : items) {
                    int batchRelativeIndex = item.path("index").asInt();
                    int globalIndex = batchStart + batchRelativeIndex;

                    JsonNode embeddingNode = item.path("embedding");
                    if (!embeddingNode.isArray() || embeddingNode.isEmpty()) {
                        throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                                "OpenAI returned an empty embedding vector at index " + globalIndex);
                    }

                    List<Double> vector = new ArrayList<>();
                    embeddingNode.forEach(value -> vector.add(value.asDouble()));

                    result.put(globalIndex, new EmbeddingResult(
                            buildVectorId(documentId, globalIndex),
                            objectMapper.writeValueAsString(vector),
                            openAIConfig.getEmbeddingModel()
                    ));
                }
            }

            log.info("Generated {} OpenAI embeddings for document {}", result.size(), documentId);
            return result;

        } catch (AppException e) {
            throw e;
        } catch (WebClientResponseException.Unauthorized e) {
            throw new AppException(ErrorCode.OPENAI_AUTH_FAILED,
                    "OpenAI authentication failed. Please verify OPENAI_API_KEY.");
        } catch (WebClientResponseException e) {
            log.error("OpenAI embeddings API error: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "OpenAI API error: " + formatOpenAiError(e.getStatusCode(), e.getResponseBodyAsString()));
        } catch (Exception e) {
            log.error("OpenAI embedding generation failed", e);
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "OpenAI embedding generation failed: " + e.getMessage());
        }
    }

    public List<Double> generateQueryEmbedding(String question) {
        Map<Integer, EmbeddingResult> result = generateBatchEmbeddings(0L, List.of(question));
        EmbeddingResult embedding = result.get(0);
        if (embedding == null) {
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "Failed to create query embedding.");
        }
        return parseEmbeddingVector(embedding.embeddingVector());
    }

    public List<Double> parseEmbeddingVector(String serializedEmbedding) {
        if (serializedEmbedding == null || serializedEmbedding.isBlank()) {
            return List.of();
        }
        try {
            JsonNode node = objectMapper.readTree(serializedEmbedding);
            if (!node.isArray()) {
                return List.of();
            }

            List<Double> vector = new ArrayList<>();
            node.forEach(value -> vector.add(value.asDouble()));
            return vector;
        } catch (Exception e) {
            log.warn("Cannot parse embedding vector payload", e);
            return List.of();
        }
    }

    public double cosineSimilarity(List<Double> left, List<Double> right) {
        if (left == null || right == null || left.isEmpty() || right.isEmpty() || left.size() != right.size()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double leftNorm = 0.0;
        double rightNorm = 0.0;

        for (int index = 0; index < left.size(); index++) {
            double leftValue = left.get(index);
            double rightValue = right.get(index);
            dotProduct += leftValue * rightValue;
            leftNorm += leftValue * leftValue;
            rightNorm += rightValue * rightValue;
        }

        if (leftNorm == 0.0 || rightNorm == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
    }

    private String buildVectorId(Long documentId, int chunkIndex) {
        return "openai:" + openAIConfig.getEmbeddingModel() + ":" + documentId + ":" + chunkIndex;
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

    private JsonNode requestEmbeddings(WebClient webClient, List<String> inputs) throws Exception {
        HttpResponsePayload payload = webClient.post()
                .uri("/embeddings")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "model", openAIConfig.getEmbeddingModel(),
                        "input", inputs
                ))
                .exchangeToMono(response -> response.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .map(body -> new HttpResponsePayload(response.statusCode(), body)))
                .timeout(Duration.ofSeconds(openAIConfig.getTimeout()))
                .block();

        if (payload == null) {
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "OpenAI embeddings request returned no HTTP payload.");
        }
        if (!payload.statusCode().is2xxSuccessful()) {
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "OpenAI API error: " + formatOpenAiError(payload.statusCode(), payload.body()));
        }
        if (payload.body() == null || payload.body().isBlank()) {
            throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                    "OpenAI returned an empty response body.");
        }

        return objectMapper.readTree(payload.body());
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

    public record EmbeddingResult(String vectorId, String embeddingVector, String embeddingModel) {
    }

    private record HttpResponsePayload(HttpStatusCode statusCode, String body) {
    }
}
