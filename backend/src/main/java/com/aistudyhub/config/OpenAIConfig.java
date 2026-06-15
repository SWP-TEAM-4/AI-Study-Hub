package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for OpenAI API integration.
 * <p>
 * Owner: BE2 – AI / OpenAI config (Extended by BE-016 for embeddings)
 * <p>
 * OpenAI API is used for:
 * - Chat completions (GPT-4o-mini)
 * - Text embeddings (text-embedding-3-small)
 */
@Getter
@Configuration
public class OpenAIConfig {

    /**
     * OpenAI API key for authentication.
     * Must be provided via environment variable: OPENAI_API_KEY
     */
    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    /**
     * OpenAI chat model name.
     * Default: gpt-4o-mini
     */
    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String model;

    /**
     * OpenAI API base URL.
     * Default: https://api.openai.com/v1
     */
    @Value("${app.ai.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    /**
     * OpenAI embedding model name.
     * Default: text-embedding-3-small
     */
    @Value("${app.ai.openai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    /**
     * Number of inputs to send per embeddings request.
     * Smaller batches reduce response size and avoid client buffering issues.
     */
    @Value("${app.ai.openai.embedding-batch-size:12}")
    private int embeddingBatchSize;

    /**
     * Maximum response bytes buffered in memory for embeddings responses.
     * Default: 16 MB
     */
    @Value("${app.ai.openai.max-in-memory-bytes:16777216}")
    private int maxInMemoryBytes;

    /**
     * Embeddings API endpoint URL.
     * Derived from baseUrl: {baseUrl}/embeddings
     */
    public String getEmbeddingsUrl() {
        return baseUrl + "/embeddings";
    }

    /**
     * Request timeout in seconds for OpenAI API calls.
     * Default: 60 seconds
     */
    @Value("${app.ai.openai.timeout:60}")
    private int timeout;

    /**
     * Maximum retry attempts for failed OpenAI API calls.
     * Default: 3 attempts
     */
    @Value("${app.ai.openai.max-retries:3}")
    private int maxRetries;
}
