package com.aistudyhub.module.document.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Response trả về sau khi process document thành chunks.
 */
@Getter
@Builder
public class DocumentProcessResponse {

    private Long documentId;
    private String processingStatus;
    private String moderationStatus;
    private String violationSeverity;
    private String moderationNote;
    private int chunkCount;
    private List<DocumentChunkResponse> chunks;
    private String message;
}
