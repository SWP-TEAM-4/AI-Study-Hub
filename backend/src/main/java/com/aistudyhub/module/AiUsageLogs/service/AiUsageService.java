package com.aistudyhub.module.AiUsageLogs.service;

import java.math.BigDecimal;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.module.AiUsageLogs.dto.AdminAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;

public interface AiUsageService {
    void logUsage(Long userId,
            AiActionType actionType,
            Integer tokenCount,
            BigDecimal estimatedCost);

    UserAiUsageResponse getMyUsage(Long userId);

    AdminAiUsageResponse getAllUsage();
}
