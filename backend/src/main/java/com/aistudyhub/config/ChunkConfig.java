package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Owner: BE1 – RAG Core chunking configuration
 * <p>
 * Cấu hình tham số cho text chunking.
 * Có thể override bằng environment variable hoặc application.yml.
 */
@Getter
@Configuration
public class ChunkConfig {

    @Value("${app.chunk.size:500}")
    private int chunkSize;

    @Value("${app.chunk.overlap:50}")
    private int overlap;

    @Value("${app.chunk.max-chunks-per-doc:500}")
    private int maxChunksPerDoc;

    @Value("${app.chunk.gemini-max-input-chars:15000}")
    private int geminiMaxInputChars;
}
