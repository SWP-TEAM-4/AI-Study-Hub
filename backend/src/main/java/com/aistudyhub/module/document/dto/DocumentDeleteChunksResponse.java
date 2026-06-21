package com.aistudyhub.module.document.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Response DTO sau khi xóa chunks của document.
 */
@Getter
@Builder
public class DocumentDeleteChunksResponse {

    private boolean deleted;
    private long deletedCount;
    private String processingStatus;
}
