package com.aistudyhub.module.AiUsageLogs.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.AiUsageLogs;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.AiUsageLogs.dto.AiUsageActionBreakdownResponse;
import com.aistudyhub.module.AiUsageLogs.dto.AdminAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.dto.AiUsageDailyResponse;
import com.aistudyhub.module.AiUsageLogs.dto.AiUsageUserBreakdownResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;
import com.aistudyhub.module.reputation.service.AiQuotaTierService;
import com.aistudyhub.repository.AiUsageLogsRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageLogsRepository aiUsageLogsRepository;
    private final UserRepository userRepository;
    private final AiQuotaTierService aiQuotaTierService;

    @Value("${app.ai.usage.estimated-cost-per-1k-tokens:0}")
    private BigDecimal estimatedCostPerThousandTokens;

    @Override
    @Transactional
    public void logUsage(Long userId, AiActionType actionType, Integer tokenCount, BigDecimal estimatedCost) {
        if (userId == null || actionType == null) {
            return;
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        AiUsageLogs logs = AiUsageLogs.builder()
                .user(user)
                .actionType(actionType)
                .tokenCount(normalizeTokenCount(tokenCount))
                .estimatedCost(resolveEstimatedCost(tokenCount, estimatedCost))
                .build();
        aiUsageLogsRepository.save(logs);
    }

    @Override
    @Transactional
    public void logUsage(Long userId, AiActionType actionType, Integer tokenCount) {
        logUsage(userId, actionType, tokenCount, null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserAiUsageResponse getMyUsage(Long userId, LocalDate fromDate, LocalDate toDate, AiActionType actionType) {
        userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        List<AiUsageLogs> logs = findLogs(userId, fromDate, toDate, actionType);
        Map<String, Long> actionCounts = countByActionType(logs);
        Long totalRequests = (long) logs.size();
        Long totalTokens = sumTokens(logs);
        return UserAiUsageResponse.builder()
                .userId(userId)
                .totalRequests(totalRequests)
                .totalTokens(totalTokens)
                .estimatedTokens(totalTokens)
                .estimatedCost(sumCost(logs))
                .chatRequests(getActionCount(actionCounts, AiActionType.CHAT))
                .summaryRequests(getActionCount(actionCounts, AiActionType.SUMMARY))
                .quizGenerations(getActionCount(actionCounts, AiActionType.QUIZ_GENERATION))
                .flashcardGenerations(getActionCount(actionCounts, AiActionType.FLASHCARD_GENERATION))
                .documentChunkingRequests(getActionCount(actionCounts, AiActionType.DOCUMENT_CHUNKING))
                .documentEmbeddingRequests(getActionCount(actionCounts, AiActionType.DOCUMENT_EMBEDDING))
                .usedRequests(totalRequests)
                .actionCounts(actionCounts)
                .dailyUsage(buildDailyUsage(logs))
                .actionUsage(buildActionUsage(logs))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAiUsageResponse getAllUsage(LocalDate fromDate, LocalDate toDate, Long userId,
                                            AiActionType actionType) {
        if (userId != null) {
            userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
        List<AiUsageLogs> logs = findLogs(userId, fromDate, toDate, actionType);
        Map<String, Long> actionCounts = countByActionType(logs);
        Long totalRequests = (long) logs.size();
        Long totalTokens = sumTokens(logs);
        return AdminAiUsageResponse.builder()
                .totalRequests(totalRequests)
                .totalTokens(totalTokens)
                .estimatedTokens(totalTokens)
                .estimatedCost(sumCost(logs))
                .chatRequests(getActionCount(actionCounts, AiActionType.CHAT))
                .summaryRequests(getActionCount(actionCounts, AiActionType.SUMMARY))
                .quizGenerations(getActionCount(actionCounts, AiActionType.QUIZ_GENERATION))
                .flashcardGenerations(getActionCount(actionCounts, AiActionType.FLASHCARD_GENERATION))
                .documentChunkingRequests(getActionCount(actionCounts, AiActionType.DOCUMENT_CHUNKING))
                .documentEmbeddingRequests(getActionCount(actionCounts, AiActionType.DOCUMENT_EMBEDDING))
                .usedRequests(totalRequests)
                .actionCounts(actionCounts)
                .dailyUsage(buildDailyUsage(logs))
                .userUsage(buildUserUsage(logs))
                .actionUsage(buildActionUsage(logs))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void assertQuotaAvailable(Long userId, AiActionType actionType) {
        aiQuotaTierService.assertQuotaAvailable(userId, actionType);
    }

    @Override
    @Transactional(readOnly = true)
    public void assertQuotaAvailable(Long userId, AiActionType actionType, int requestCount) {
        aiQuotaTierService.assertQuotaAvailable(userId, actionType, requestCount);
    }

    private List<AiUsageLogs> findLogs(Long userId, LocalDate fromDate, LocalDate toDate, AiActionType actionType) {
        validateDateRange(fromDate, toDate);
        LocalDateTime fromDateTime = fromDate == null ? null : fromDate.atStartOfDay();
        LocalDateTime toDateTimeExclusive = toDate == null ? null : toDate.plusDays(1).atStartOfDay();
        return aiUsageLogsRepository.findAll(buildUsageSpec(userId, actionType, fromDateTime, toDateTimeExclusive),
                Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private Specification<AiUsageLogs> buildUsageSpec(Long userId,
                                                      AiActionType actionType,
                                                      LocalDateTime fromDateTime,
                                                      LocalDateTime toDateTimeExclusive) {
        return Specification
                .where(hasUserId(userId))
                .and(hasActionType(actionType))
                .and(createdAtGreaterThanOrEqualTo(fromDateTime))
                .and(createdAtBefore(toDateTimeExclusive));
    }

    private Specification<AiUsageLogs> hasUserId(Long userId) {
        return (root, query, criteriaBuilder) -> userId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("user").get("id"), userId);
    }

    private Specification<AiUsageLogs> hasActionType(AiActionType actionType) {
        return (root, query, criteriaBuilder) -> actionType == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("actionType"), actionType);
    }

    private Specification<AiUsageLogs> createdAtGreaterThanOrEqualTo(LocalDateTime fromDateTime) {
        return (root, query, criteriaBuilder) -> fromDateTime == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), fromDateTime);
    }

    private Specification<AiUsageLogs> createdAtBefore(LocalDateTime toDateTimeExclusive) {
        return (root, query, criteriaBuilder) -> toDateTimeExclusive == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.lessThan(root.get("createdAt"), toDateTimeExclusive);
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "from date must be before or equal to to date");
        }
    }

    private Map<String, Long> countByActionType(List<AiUsageLogs> logs) {
        return logs.stream()
                .filter(log -> log.getActionType() != null)
                .collect(Collectors.groupingBy(
                        log -> log.getActionType().name(),
                        LinkedHashMap::new,
                        Collectors.counting()));
    }

    private Long getActionCount(Map<String, Long> actionCounts, AiActionType actionType) {
        return actionCounts.getOrDefault(actionType.name(), 0L);
    }

    private List<AiUsageDailyResponse> buildDailyUsage(List<AiUsageLogs> logs) {
        return logs.stream()
                .filter(log -> log.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        log -> log.getCreatedAt().toLocalDate(),
                        LinkedHashMap::new,
                        Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> AiUsageDailyResponse.builder()
                        .date(entry.getKey())
                        .totalRequests((long) entry.getValue().size())
                        .totalTokens(sumTokens(entry.getValue()))
                        .estimatedCost(sumCost(entry.getValue()))
                        .actionCounts(countByActionType(entry.getValue()))
                        .build())
                .sorted(Comparator.comparing(AiUsageDailyResponse::getDate).reversed())
                .toList();
    }

    private List<AiUsageUserBreakdownResponse> buildUserUsage(List<AiUsageLogs> logs) {
        return logs.stream()
                .filter(log -> log.getUser() != null && log.getUser().getId() != null)
                .collect(Collectors.groupingBy(
                        log -> log.getUser().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()))
                .values()
                .stream()
                .map(userLogs -> {
                    User user = userLogs.get(0).getUser();
                    return AiUsageUserBreakdownResponse.builder()
                            .userId(user.getId())
                            .email(user.getEmail())
                            .fullName(user.getFullName())
                            .totalRequests((long) userLogs.size())
                            .totalTokens(sumTokens(userLogs))
                            .estimatedCost(sumCost(userLogs))
                            .actionCounts(countByActionType(userLogs))
                            .build();
                })
                .sorted(Comparator.comparing(AiUsageUserBreakdownResponse::getTotalRequests).reversed()
                        .thenComparing(AiUsageUserBreakdownResponse::getUserId))
                .toList();
    }

    private List<AiUsageActionBreakdownResponse> buildActionUsage(List<AiUsageLogs> logs) {
        return logs.stream()
                .filter(log -> log.getActionType() != null)
                .collect(Collectors.groupingBy(
                        AiUsageLogs::getActionType,
                        LinkedHashMap::new,
                        Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> AiUsageActionBreakdownResponse.builder()
                        .actionType(entry.getKey())
                        .totalRequests((long) entry.getValue().size())
                        .totalTokens(sumTokens(entry.getValue()))
                        .estimatedCost(sumCost(entry.getValue()))
                        .build())
                .sorted(Comparator.comparing(AiUsageActionBreakdownResponse::getTotalRequests).reversed()
                        .thenComparing(item -> item.getActionType().name()))
                .toList();
    }

    private Long sumTokens(List<AiUsageLogs> logs) {
        return logs.stream()
                .mapToLong(log -> log.getTokenCount() == null ? 0L : log.getTokenCount())
                .sum();
    }

    private BigDecimal sumCost(List<AiUsageLogs> logs) {
        return logs.stream()
                .map(log -> log.getEstimatedCost() == null ? BigDecimal.ZERO : log.getEstimatedCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(6, RoundingMode.HALF_UP);
    }

    private Integer normalizeTokenCount(Integer tokenCount) {
        if (tokenCount == null || tokenCount < 0) {
            return 0;
        }
        return tokenCount;
    }

    private BigDecimal resolveEstimatedCost(Integer tokenCount, BigDecimal estimatedCost) {
        if (estimatedCost != null) {
            return estimatedCost.max(BigDecimal.ZERO).setScale(6, RoundingMode.HALF_UP);
        }
        Integer normalizedTokenCount = normalizeTokenCount(tokenCount);
        if (normalizedTokenCount == 0
                || estimatedCostPerThousandTokens == null
                || estimatedCostPerThousandTokens.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(6, RoundingMode.HALF_UP);
        }
        return estimatedCostPerThousandTokens
                .multiply(BigDecimal.valueOf(normalizedTokenCount))
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
    }

}
