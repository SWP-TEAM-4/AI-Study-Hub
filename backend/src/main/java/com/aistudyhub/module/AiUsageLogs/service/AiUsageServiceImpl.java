package com.aistudyhub.module.AiUsageLogs.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.AiUsageLogs;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.AiUsageLogs.dto.AdminAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;
import com.aistudyhub.repository.AiUsageLogsRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageLogsRepository aiUsageLogsRepository;
    private final UserRepository userRepository;

    @Override
    public void logUsage(Long userId, AiActionType actionType, Integer tokenCount, BigDecimal estimatedCost) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        AiUsageLogs logs = AiUsageLogs.builder().user(user)
                .actionType(actionType)
                .tokenCount(tokenCount)
                .estimatedCost(estimatedCost)
                .build();
        aiUsageLogsRepository.save(logs);
    }

    @Override
    public UserAiUsageResponse getMyUsage(Long userId) {
        List<AiUsageLogs> logs = aiUsageLogsRepository.findByUserId(userId);
        Map<String, Long> actionCounts = logs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getActionType().name(),
                        Collectors.counting()));

        int totalTokens = logs.stream()
                .mapToInt(log -> log.getTokenCount() == null ? 0 : log.getTokenCount())
                .sum();

        BigDecimal totalCost = logs.stream()
                .map(log -> log.getEstimatedCost() == null
                        ? BigDecimal.ZERO
                        : log.getEstimatedCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserAiUsageResponse.builder()
                .totalRequests((long) logs.size())
                .totalTokens(totalTokens)
                .estimatedCost(totalCost)
                .actionCounts(actionCounts)
                .build();
    }

    @Override
    public AdminAiUsageResponse getAllUsage() {
        List<AiUsageLogs> logs = aiUsageLogsRepository.findAll();

        Map<String, Long> actionCounts = logs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getActionType().name(),
                        Collectors.counting()));

        int totalTokens = logs.stream()
                .mapToInt(log -> log.getTokenCount() == null ? 0 : log.getTokenCount())
                .sum();

        BigDecimal totalCost = logs.stream()
                .map(log -> log.getEstimatedCost() == null
                        ? BigDecimal.ZERO
                        : log.getEstimatedCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminAiUsageResponse.builder()
                .totalRequests((long) logs.size())
                .totalTokens(totalTokens)
                .estimatedCost(totalCost)
                .actionCounts(actionCounts)
                .build();
    }

}
