package com.aistudyhub.module.community.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu duyệt/bác bỏ báo cáo từ Admin/Moderator.
 * Owner: BE3 (Task BE-045)
 */
@Getter
@Setter
public class ReportModerationRequest {
    /**
     * Ghi chú xử lý của admin (không bắt buộc).
     */
    private String adminNote;
}
