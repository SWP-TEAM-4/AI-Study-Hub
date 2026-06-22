package com.aistudyhub.module.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đóng gói dữ liệu yêu cầu nhân bản (Clone) tài nguyên từ Chợ về workspace
 * cá nhân.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceCloneRequest {
    private Long targetNotebookId;
}
