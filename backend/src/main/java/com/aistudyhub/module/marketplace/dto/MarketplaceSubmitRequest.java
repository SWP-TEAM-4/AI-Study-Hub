package com.aistudyhub.module.marketplace.dto;

import lombok.*;

/**
 * DTO nhận thông tin ghi chú khi học viên đăng tải tài nguyên lên chợ.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceSubmitRequest {
    private String note;
}