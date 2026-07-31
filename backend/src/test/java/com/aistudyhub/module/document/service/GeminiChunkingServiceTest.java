package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.config.ChunkConfig;
import com.aistudyhub.config.GeminiConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeminiChunkingServiceTest {

    private GeminiChunkingService geminiChunkingService;

    @BeforeEach
    void setUp() {
        ChunkConfig chunkConfig = new ChunkConfig();
        ReflectionTestUtils.setField(chunkConfig, "chunkSize", 120);
        ReflectionTestUtils.setField(chunkConfig, "overlap", 20);
        ReflectionTestUtils.setField(chunkConfig, "maxChunksPerDoc", 20);
        ReflectionTestUtils.setField(chunkConfig, "geminiMaxInputChars", 2_000);

        GeminiConfig geminiConfig = new GeminiConfig();
        ReflectionTestUtils.setField(geminiConfig, "apiKey", "");
        ReflectionTestUtils.setField(geminiConfig, "baseUrl", "https://example.invalid");
        ReflectionTestUtils.setField(geminiConfig, "model", "gemini-test");
        ReflectionTestUtils.setField(geminiConfig, "temperature", 0.1);
        ReflectionTestUtils.setField(geminiConfig, "timeout", 1);
        ReflectionTestUtils.setField(geminiConfig, "maxRetries", 1);
        ReflectionTestUtils.setField(geminiConfig, "retryInitialDelayMs", 1L);
        ReflectionTestUtils.setField(geminiConfig, "minRequestIntervalMs", 0L);

        TextChunkingService textChunkingService = new TextChunkingService(chunkConfig);
        geminiChunkingService = new GeminiChunkingService(
                geminiConfig,
                chunkConfig,
                textChunkingService,
                WebClient.builder(),
                new ObjectMapper());
    }

    @Test
    void chunkTextWithMetadataFallsBackToLocalChunkingWhenGeminiKeyMissing() {
        GeminiChunkingService.ChunkingOutcome outcome =
                geminiChunkingService.chunkTextWithMetadata(sampleText(), null, null);

        assertEquals(GeminiChunkingService.ChunkingStrategy.LOCAL_HEURISTIC_FALLBACK, outcome.strategy());
        assertFalse(outcome.chunks().isEmpty());
        assertTrue(outcome.detail().contains("Missing GEMINI_API_KEY"));
    }

    @Test
    void chunkTextWithSafetyReviewFallsBackToLocalChunkingAndAdminReviewWhenGeminiKeyMissing() {
        GeminiChunkingService.ModeratedChunkingOutcome outcome =
                geminiChunkingService.chunkTextWithSafetyReview(sampleText(), null, null);

        assertEquals(GeminiChunkingService.ChunkingStrategy.LOCAL_HEURISTIC_FALLBACK, outcome.strategy());
        assertFalse(outcome.chunks().isEmpty());
        assertFalse(outcome.safetyReview().safe());
        assertEquals(DocumentViolationSeverity.MEDIUM, outcome.safetyReview().severity());
        assertEquals("GEMINI_REVIEW_UNAVAILABLE", outcome.safetyReview().category());
        assertTrue(outcome.safetyReview().policyFlags().contains("GEMINI_FALLBACK_REVIEW_REQUIRED"));
    }

    private String sampleText() {
        return """
                [[PAGE:1]]
                This is a normal study document about database indexing and query planning.

                The material explains B-tree indexes, selectivity, and why query plans change
                when table statistics are updated by the database engine.
                """;
    }
}
