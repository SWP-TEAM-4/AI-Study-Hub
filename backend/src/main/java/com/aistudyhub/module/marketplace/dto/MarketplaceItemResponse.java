package com.aistudyhub.module.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;

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
    // ID môn học liên kết với tài nguyên này
    private Long subjectId;
    // Họ tên đầy đủ của người tạo ra tài nguyên này (lấy từ User.fullName)
    private String creatorName;
    // Tổng số lượt tải/clone của tài nguyên này về kho lưu trữ cá nhân
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    // Trạng thái kiểm duyệt chợ của tài nguyên (Luôn là APPROVED khi hiển thị trên
    // Marketplace)
    private MarketStatus marketStatus;
    private Visibility visibility;
    private String fileUrl;
    private String fileType;
    private LocalDateTime createdAt;
    private Long clonedFromId;
}
