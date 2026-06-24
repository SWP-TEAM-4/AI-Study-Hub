package com.aistudyhub.module.community.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO nhận dữ liệu yêu cầu ẩn/khôi phục tài nguyên từ Admin.
 * Owner: BE3 (Task BE-045)
 */
@Getter
@Setter
public class ContentModerationRequest {
    /**
     * Lý do ẩn hoặc khôi phục tài nguyên (không bắt buộc).
     */
    private String reason;
}
