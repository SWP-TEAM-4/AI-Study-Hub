package com.aistudyhub.module.community.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin báo cáo vi phạm cho FE.
 * Owner: BE3 (Task BE-044)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentReportResponse {

    private Long id;

    /** Loại tài nguyên bị báo cáo: "DOCUMENT", "QUIZ", "FLASHCARD_DECK" */
    private String targetType;

    /** ID tài nguyên bị báo cáo */
    private Long targetId;

    /** Tiêu đề tài nguyên – tiện cho hiển thị */
    private String targetTitle;

    /** Lý do báo cáo */
    private String reasonType;

    /** Chi tiết mô tả vi phạm */
    private String reportDetails;

    /** Mức độ nghiêm trọng */
    private String severityLevel;

    /** Trạng thái xử lý: PENDING_ADMIN, RESOLVED, REJECTED */
    private String status;

    /** ID người báo cáo */
    private Long reporterId;

    /** Tên người báo cáo */
    private String reporterName;

    /** Thời điểm tạo báo cáo */
    private LocalDateTime createdAt;
}
