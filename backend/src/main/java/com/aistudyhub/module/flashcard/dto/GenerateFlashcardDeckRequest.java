package com.aistudyhub.module.flashcard.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận yêu cầu tự động tạo bộ Flashcard Deck từ tài liệu hoặc sổ tay.
 * Owner: BE3 (Task BE-026)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateFlashcardDeckRequest {

    private Long notebookId;
    private Long documentId;
    @NotNull(message = "Number of cards is required")
    @Min(value = 1, message = "Number of cards must be at least 1")
    private Integer numberOfCards;
}
