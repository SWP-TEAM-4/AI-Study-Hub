package com.aistudyhub.module.AiUsageLogs.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.module.AiUsageLogs.dto.AdminAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;

public interface AiUsageService {
    void logUsage(Long userId,
            AiActionType actionType,
            Integer tokenCount,
            BigDecimal estimatedCost);

    void logUsage(Long userId,
            AiActionType actionType,
            Integer tokenCount);

    UserAiUsageResponse getMyUsage(Long userId,
            LocalDate fromDate,
            LocalDate toDate,
            AiActionType actionType);

    AdminAiUsageResponse getAllUsage(LocalDate fromDate,
            LocalDate toDate,
            Long userId,
            AiActionType actionType);

    void assertQuotaAvailable(Long userId, AiActionType actionType);
}
