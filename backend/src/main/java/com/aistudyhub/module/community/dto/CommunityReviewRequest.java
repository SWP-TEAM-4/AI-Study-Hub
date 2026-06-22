package com.aistudyhub.module.community.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu từ FE khi tạo hoặc cập nhật đánh giá cộng đồng.
 * Owner: BE3 (Task BE-042)
 */
@Getter
@Setter
public class CommunityReviewRequest {

    /**
     * Loại tài nguyên đích: "DOCUMENT", "QUIZ", hoặc "FLASHCARD_DECK".
     */
    @NotBlank(message = "targetType is required")
    private String targetType;

    /**
     * ID của tài nguyên đích cần đánh giá.
     */
    @NotNull(message = "targetId is required")
    private Long targetId;

    /**
     * Điểm đánh giá từ 1 đến 5 sao.
     */
    @NotNull(message = "rating is required")
    @Min(value = 1, message = "rating must be at least 1")
    @Max(value = 5, message = "rating must be at most 5")
    private Integer rating;

    /**
     * Nội dung bình luận (không bắt buộc).
     */
    private String content;
}
