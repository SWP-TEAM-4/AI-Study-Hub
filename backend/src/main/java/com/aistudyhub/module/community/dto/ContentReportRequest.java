package com.aistudyhub.module.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu từ FE khi tạo báo cáo vi phạm nội dung.
 * Owner: BE3 (Task BE-044)
 */
@Getter
@Setter
public class ContentReportRequest {

    /**
     * Loại tài nguyên bị báo cáo: "DOCUMENT", "QUIZ", hoặc "FLASHCARD_DECK".
     */
    @NotBlank(message = "targetType is required")
    private String targetType;

    /**
     * ID của tài nguyên bị báo cáo.
     */
    @NotNull(message = "targetId is required")
    private Long targetId;

    /**
     * Lý do báo cáo: COPYRIGHT, SPAM, INAPPROPRIATE, ...
     */
    @NotBlank(message = "reasonType is required")
    private String reasonType;

    /**
     * Chi tiết mô tả vi phạm (không bắt buộc).
     */
    private String reportDetails;

    /**
     * Mức độ nghiêm trọng: LOW, MEDIUM, HIGH. Mặc định LOW nếu không truyền.
     */
    private String severityLevel;
}
