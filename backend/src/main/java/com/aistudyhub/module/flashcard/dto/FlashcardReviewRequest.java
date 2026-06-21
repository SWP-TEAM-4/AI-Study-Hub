package com.aistudyhub.module.flashcard.dto;

import com.aistudyhub.common.enums.FlashcardReviewResult;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardReviewRequest {

    // Kết quả ôn tập (bắt buộc phải có)
    @NotNull(message = "Review result is required")
    private FlashcardReviewResult result;
}
