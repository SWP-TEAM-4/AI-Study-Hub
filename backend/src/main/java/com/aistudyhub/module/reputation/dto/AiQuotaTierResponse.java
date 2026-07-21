package com.aistudyhub.module.reputation.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AiQuotaTierResponse {
    private Long id;
    private String name;
    private Integer minReputationPoints;
    private Integer dailyChatLimit;
    private Integer monthlyChatLimit;
    private Integer dailySummaryLimit;
    private Integer monthlySummaryLimit;
    private Integer dailyGenerationLimit;
    private Integer monthlyGenerationLimit;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
