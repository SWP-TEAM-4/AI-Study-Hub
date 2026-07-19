package com.aistudyhub.module.AiUsageLogs.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAiUsageResponse {
    private Long totalRequests;
    private Long totalTokens;
    private Long estimatedTokens;
    private BigDecimal estimatedCost;
    private Long chatRequests;
    private Long summaryRequests;
    private Long quizGenerations;
    private Long flashcardGenerations;
    private Long documentChunkingRequests;
    private Long documentEmbeddingRequests;
    private Long usedRequests;
    private Map<String, Long> actionCounts;
    private List<AiUsageDailyResponse> dailyUsage;
    private List<AiUsageUserBreakdownResponse> userUsage;
    private List<AiUsageActionBreakdownResponse> actionUsage;
}
