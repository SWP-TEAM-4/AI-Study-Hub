package com.aistudyhub.module.document.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Response DTO cho mỗi document chunk.
 * Dùng cho cả GET /chunks và findRelevantChunks().
 */
@Getter
@Builder
public class DocumentChunkResponse {

    private Long id;
    private Long documentId;
    private String documentTitle;
    private Integer chunkIndex;
    private String textContent;
    private Integer tokenEstimate;
    private Integer sourcePage;
    private String sourceSection;
    private String vectorId;
}
