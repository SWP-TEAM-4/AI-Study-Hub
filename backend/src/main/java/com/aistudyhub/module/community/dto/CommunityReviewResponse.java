package com.aistudyhub.module.community.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin đánh giá cộng đồng cho FE.
 * Bao gồm tên và avatar người đánh giá để hiển thị trực tiếp.
 * Owner: BE3 (Task BE-042)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityReviewResponse {

    private Long id;

    /** Loại tài nguyên: "DOCUMENT", "QUIZ", "FLASHCARD_DECK" */
    private String targetType;

    /** ID tài nguyên đích */
    private Long targetId;

    /** Điểm đánh giá 1-5 */
    private Integer rating;

    /** Nội dung bình luận */
    private String content;

    /** ID người đánh giá */
    private Long reviewerId;

    /** Tên người đánh giá – tiện cho FE hiển thị */
    private String reviewerName;

    /** Avatar người đánh giá */
    private String reviewerAvatarUrl;

    /** Thời điểm tạo đánh giá */
    private LocalDateTime createdAt;
}
