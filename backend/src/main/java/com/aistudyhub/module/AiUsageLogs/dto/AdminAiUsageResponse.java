package com.aistudyhub.module.AiUsageLogs.dto;

import java.math.BigDecimal;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAiUsageResponse {
    private Long totalRequests;
    private Integer totalTokens;
    private BigDecimal estimatedCost;
    private Map<String, Long> actionCounts;
}
