package com.aistudyhub.module.AiUsageLogs.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiUsageDailyResponse {
    private LocalDate date;
    private Long totalRequests;
    private Long totalTokens;
    private BigDecimal estimatedCost;
    private Map<String, Long> actionCounts;
}
