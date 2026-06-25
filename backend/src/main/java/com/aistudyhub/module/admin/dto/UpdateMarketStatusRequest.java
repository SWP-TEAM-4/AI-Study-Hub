package com.aistudyhub.module.admin.dto;

import com.aistudyhub.common.enums.MarketStatus;

import lombok.Data;

@Data
public class UpdateMarketStatusRequest {
    private MarketStatus marketStatus;
}
