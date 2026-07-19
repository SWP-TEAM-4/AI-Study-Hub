package com.aistudyhub.module.AiUsageLogs.dto;

import java.math.BigDecimal;

import com.aistudyhub.common.enums.AiActionType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiUsageActionBreakdownResponse {
    private AiActionType actionType;
    private Long totalRequests;
    private Long totalTokens;
    private BigDecimal estimatedCost;
}
