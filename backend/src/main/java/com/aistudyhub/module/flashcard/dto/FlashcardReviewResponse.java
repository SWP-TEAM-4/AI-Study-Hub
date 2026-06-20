package com.aistudyhub.module.flashcard.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO trả về kết quả tiến độ ôn tập của thẻ sau khi đánh giá.
 * Owner: BE3 (Task BE-025)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardReviewResponse {

    // ID của thẻ flashcard vừa được ôn tập
    private Long flashcardId;

    // Mức hộp Leitner hiện tại (từ 1 đến 5)
    private Integer boxLevel;

    // Thời điểm vừa nhấn đánh giá
    private LocalDateTime lastReviewed;

    // Thời điểm dự kiến cần ôn tập lại tiếp theo
    private LocalDateTime nextReviewAt;
}