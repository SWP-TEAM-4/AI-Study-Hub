package com.aistudyhub.module.rag.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Shared RAG DTO dùng chung cho chat, quiz, flashcard và các integration khác.
 */
@Getter
@Builder
public class RelevantChunkResponse {

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
