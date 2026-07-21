package com.aistudyhub.module.reputation.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiQuotaStatusResponse {
    private Long userId;
    private Integer reputationPoints;
    private AiQuotaTierResponse tier;
    private Long dailyChatUsed;
    private Long monthlyChatUsed;
    private Long dailySummaryUsed;
    private Long monthlySummaryUsed;
    private Long dailyGenerationUsed;
    private Long monthlyGenerationUsed;
    private Boolean chatAvailable;
    private Boolean summaryAvailable;
    private Boolean generationAvailable;
}
