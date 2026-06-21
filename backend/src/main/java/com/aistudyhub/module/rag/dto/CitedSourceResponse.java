package com.aistudyhub.module.rag.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Shared citation DTO để toàn hệ thống trả về cùng một format citation.
 */
@Getter
@Builder
public class CitedSourceResponse {

    private Long documentId;
    private String documentTitle;
    private Integer chunkIndex;
    private Integer sourcePage;
    private String sourceSection;
    private String excerpt;
}
