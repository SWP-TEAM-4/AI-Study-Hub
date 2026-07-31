package com.aistudyhub.module.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.quiz.dto.QuestionResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đại diện cho một phần tử tài nguyên trên Chợ tài liệu (Marketplace).
 * Được sử dụng thống nhất cho cả API duyệt tài liệu/quiz/flashcard và API tìm
 * kiếm tổng hợp.
 * 
 * Owner: BE3 (Task BE-028)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceItemResponse {

    // Loại tài nguyên học tập: "DOCUMENT", "QUIZ", hoặc "FLASHCARD_DECK"
    private String targetType;
    // ID tương ứng của thực thể trong database
    private Long targetId;
    // Tiêu đề của tài liệu, đề thi hoặc bộ thẻ ghi nhớ
    private String title;
    private String description;
    private String examType;
    // ID môn học liên kết với tài nguyên này
    private Long subjectId;
    private Long creatorId;
    // Họ tên đầy đủ của người tạo ra tài nguyên này (lấy từ User.fullName)
    private String creatorName;
    // Tổng số lượt tải/clone của tài nguyên này về kho lưu trữ cá nhân
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private Integer communityReviewCount;
    private BigDecimal communityRatingAvg;
    // Trạng thái kiểm duyệt chợ của tài nguyên (Luôn là APPROVED khi hiển thị trên
    // Marketplace)
    private MarketStatus marketStatus;
    private Visibility visibility;
    private String fileUrl;
    private String fileType;
    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
    private String submissionNote;
    private String policyMode;
    private Integer requiredVotes;
    private Integer approvalPercentageRequired;
    private Long clonedFromId;
    private List<QuestionResponse> questions;
    private List<FlashcardResponse> cards;
}
