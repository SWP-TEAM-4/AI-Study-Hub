package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.config.OpenAIConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@Primary
@Profile("!test")
@RequiredArgsConstructor
public class OpenAiPracticeJsonGenerationClient implements AiJsonGenerationClient, EnvironmentAware {

    private static final String FALLBACK_PROPERTY = "app.ai.practice.fallback-to-stub-on-error";

    private final OpenAIConfig openAIConfig;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final StubAiJsonGenerationClient stubAiJsonGenerationClient;
    private Environment environment;

    @Override
    public String generate(AiPracticeGenerationRequest request, AiPracticePrompt prompt) {
        if (openAIConfig.getApiKey() == null || openAIConfig.getApiKey().isBlank()) {
            return fallbackOrThrow(request, prompt,
                    "Missing OpenAI API key for AI practice generation", null);
        }

        try {
            HttpResponsePayload payload = buildWebClient().post()
                    .uri("/responses")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestPayload(prompt))
                    .exchangeToMono(response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(body -> new HttpResponsePayload(response.statusCode(), body)))
                    .timeout(Duration.ofSeconds(openAIConfig.getTimeout()))
                    .block();

            if (payload == null) {
                return fallbackOrThrow(request, prompt,
                        "OpenAI responses request returned no payload", null);
            }
            if (!payload.statusCode().is2xxSuccessful()) {
                return fallbackOrThrow(request, prompt,
                        "OpenAI API error: " + formatOpenAiError(payload.statusCode(), payload.body()), null);
            }
            return extractOutputText(payload.body());
        } catch (AppException ex) {
            return fallbackOrThrow(request, prompt, ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("AI practice generation failed", ex);
            return fallbackOrThrow(request, prompt,
                    "AI practice generation failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String repairMalformedJson(AiPracticeGenerationRequest request, AiPracticePrompt prompt,
                                      String malformedJson, String validationMessage) {
        if (openAIConfig.getApiKey() == null || openAIConfig.getApiKey().isBlank()) {
            return fallbackOrThrow(request, prompt,
                    "Missing OpenAI API key for AI practice JSON repair", null);
        }

        try {
            HttpResponsePayload payload = buildWebClient().post()
                    .uri("/responses")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRepairRequestPayload(prompt, malformedJson, validationMessage))
                    .exchangeToMono(response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(body -> new HttpResponsePayload(response.statusCode(), body)))
                    .timeout(Duration.ofSeconds(openAIConfig.getTimeout()))
                    .block();

            if (payload == null) {
                return fallbackOrThrow(request, prompt,
                        "OpenAI repair request returned no payload", null);
            }
            if (!payload.statusCode().is2xxSuccessful()) {
                return fallbackOrThrow(request, prompt,
                        "OpenAI repair API error: " + formatOpenAiError(payload.statusCode(), payload.body()), null);
            }
            return extractOutputText(payload.body());
        } catch (AppException ex) {
            return fallbackOrThrow(request, prompt, ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("AI practice JSON repair failed", ex);
            return fallbackOrThrow(request, prompt,
                    "AI practice JSON repair failed: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
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

    private Map<String, Object> buildRequestPayload(AiPracticePrompt prompt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", openAIConfig.getModel());
        payload.put("instructions", prompt.instructions());
        payload.put("input", prompt.input());
        return payload;
    }

    private Map<String, Object> buildRepairRequestPayload(AiPracticePrompt prompt, String malformedJson,
                                                          String validationMessage) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", openAIConfig.getModel());
        payload.put("instructions", """
                You repair malformed JSON for a backend import flow.
                Return only valid JSON.
                Do not use markdown.
                Preserve the original meaning as much as possible.
                The repaired JSON must follow the original backend instructions exactly.
                """.strip());
        payload.put("input", """
                Original backend instructions:
                %s

                Validation/parsing error:
                %s

                Malformed JSON to repair:
                %s
                """.formatted(
                prompt.instructions(),
                validationMessage == null || validationMessage.isBlank() ? "Unknown JSON parsing error" : validationMessage,
                malformedJson == null ? "" : malformedJson
        ));
        return payload;
    }

    private String extractOutputText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode outputNode = root.path("output");
        if (!outputNode.isArray() || outputNode.isEmpty()) {
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    "OpenAI response did not contain any output");
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
                    builder.append(text.trim());
                }
            }
        }
        if (builder.length() == 0) {
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    "OpenAI response did not contain JSON text output");
        }
        return builder.toString();
    }

    private String formatOpenAiError(HttpStatusCode statusCode, String responseBody) {
        return statusCode + (responseBody == null || responseBody.isBlank() ? "" : " - " + responseBody);
    }

    private String fallbackOrThrow(AiPracticeGenerationRequest request, AiPracticePrompt prompt,
                                   String reason, Exception originalException) {
        if (!isFallbackEnabled()) {
            if (originalException instanceof AppException appException) {
                throw appException;
            }
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED, reason);
        }

        log.warn("OpenAI practice generation unavailable. Falling back to stub generator. Reason: {}", reason);
        try {
            return stubAiJsonGenerationClient.generate(request, prompt);
        } catch (Exception fallbackException) {
            log.error("Stub fallback for AI practice generation also failed", fallbackException);
            if (originalException instanceof AppException appException) {
                throw appException;
            }
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    reason + " | Stub fallback also failed: " + fallbackException.getMessage());
        }
    }

    private boolean isFallbackEnabled() {
        return environment == null
                || Boolean.parseBoolean(environment.getProperty(FALLBACK_PROPERTY, "false"));
    }

    private record HttpResponsePayload(HttpStatusCode statusCode, String body) {
    }
}
