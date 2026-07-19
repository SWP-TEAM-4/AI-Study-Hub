package com.aistudyhub.module.AiUsageLogs.dto;

import java.math.BigDecimal;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiUsageUserBreakdownResponse {
    private Long userId;
    private String email;
    private String fullName;
    private Long totalRequests;
    private Long totalTokens;
    private BigDecimal estimatedCost;
    private Map<String, Long> actionCounts;
}
