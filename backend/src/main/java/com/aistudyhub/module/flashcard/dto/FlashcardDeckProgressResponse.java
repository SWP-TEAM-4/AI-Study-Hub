package com.aistudyhub.module.flashcard.dto;

import lombok.*;

/**
 * DTO trả về thống kê tiến độ ôn tập của một bộ bài flashcard.
 * Owner: BE3 (Task BE-025)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDeckProgressResponse {

    // ID của bộ bài flashcard
    private Long deckId;

    // Số thẻ trong bộ bài đã được user ôn tập (đã có tiến độ)
    private Integer reviewedCards;

    // Tổng số thẻ có trong bộ bài này
    private Integer totalCards;

    // Tỷ lệ phần trăm các thẻ ở Box >= 2 trên tổng số thẻ đã ôn tập (Reviewed)
    private Double rememberedRate;
}