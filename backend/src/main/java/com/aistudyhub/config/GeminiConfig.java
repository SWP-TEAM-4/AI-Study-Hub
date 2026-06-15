package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Google Gemini API integration.
 * <p>
 * Owner: BE1 – RAG Core (BE-016)
 * <p>
 * Google Gemini API is used for intelligent semantic chunking of documents.
 * The model analyzes document structure and creates context-aware chunks
 * that preserve meaning and coherence for effective RAG retrieval.
 */
@Getter
@Configuration
public class GeminiConfig {

    /**
     * Google Gemini API key for authentication.
     * Must be provided via environment variable: GEMINI_API_KEY
     * <p>
     * Get your API key from: https://makersuite.google.com/app/apikey
     */
    @Value("${app.ai.gemini.api-key:}")
    private String apiKey;

    /**
     * Gemini API base URL.
     * Default: https://generativelanguage.googleapis.com/v1beta/models
     */
    @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    /**
     * Gemini model name to use for chunking.
     * Default: gemini-3.5-flash (stable general-purpose Gemini model)
     * Alternatives: gemini-2.5-flash, gemini-2.5-pro
     */
    @Value("${app.ai.gemini.model:gemini-3.5-flash}")
    private String model;

    /**
     * Temperature for Gemini generation (0.0 to 1.0).
     * Lower values make output more deterministic.
     * For chunking, we use 0.1 for consistency.
     */
    @Value("${app.ai.gemini.temperature:0.1}")
    private double temperature;

    /**
     * Request timeout in seconds for Gemini API calls.
     * Default: 60 seconds
     */
    @Value("${app.ai.gemini.timeout:60}")
    private int timeout;

    /**
     * Maximum retry attempts for failed Gemini API calls.
     * Default: 3 attempts
     */
    @Value("${app.ai.gemini.max-retries:3}")
    private int maxRetries;

    /**
     * Get the complete API endpoint URL for content generation.
     * Format: {baseUrl}/{model}:generateContent
     *
     * @return Full API endpoint URL
     */
    public String getApiUrl() {
        return String.format("%s/%s:generateContent", baseUrl, model);
    }
}
