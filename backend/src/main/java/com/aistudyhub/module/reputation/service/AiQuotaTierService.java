package com.aistudyhub.module.reputation.service;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.AiQuotaTier;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.reputation.dto.AiQuotaStatusResponse;
import com.aistudyhub.module.reputation.dto.AiQuotaTierRequest;
import com.aistudyhub.module.reputation.dto.AiQuotaTierResponse;
import com.aistudyhub.repository.AiQuotaTierRepository;
import com.aistudyhub.repository.AiUsageLogsRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AiQuotaTierService {

    private static final Set<AiActionType> GENERATION_ACTIONS = Set.of(
            AiActionType.QUIZ_GENERATION,
            AiActionType.FLASHCARD_GENERATION,
            AiActionType.DOCUMENT_CHUNKING,
            AiActionType.DOCUMENT_EMBEDDING);

    private final AiQuotaTierRepository aiQuotaTierRepository;
    private final AiUsageLogsRepository aiUsageLogsRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AiQuotaTierResponse> listTiers() {
        return aiQuotaTierRepository.findAllByOrderByMinReputationPointsAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AiQuotaTierResponse createTier(AiQuotaTierRequest request, Long actorUserId) {
        validateDuplicate(request, null);
        AiQuotaTier tier = AiQuotaTier.builder()
                .name(normalizeName(request.getName()))
                .minReputationPoints(request.getMinReputationPoints())
                .dailyChatLimit(request.getDailyChatLimit())
                .monthlyChatLimit(request.getMonthlyChatLimit())
                .dailySummaryLimit(request.getDailySummaryLimit())
                .monthlySummaryLimit(request.getMonthlySummaryLimit())
                .dailyGenerationLimit(request.getDailyGenerationLimit())
                .monthlyGenerationLimit(request.getMonthlyGenerationLimit())
                .enabled(request.getEnabled() != null ? request.getEnabled() : Boolean.TRUE)
                .updatedBy(findActor(actorUserId))
                .build();
        return toResponse(aiQuotaTierRepository.save(tier));
    }

    @Transactional
    public AiQuotaTierResponse updateTier(Long id, AiQuotaTierRequest request, Long actorUserId) {
        AiQuotaTier tier = aiQuotaTierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AI_QUOTA_TIER_NOT_FOUND));
        validateDuplicate(request, id);

        tier.setName(normalizeName(request.getName()));
        tier.setMinReputationPoints(request.getMinReputationPoints());
        tier.setDailyChatLimit(request.getDailyChatLimit());
        tier.setMonthlyChatLimit(request.getMonthlyChatLimit());
        tier.setDailySummaryLimit(request.getDailySummaryLimit());
        tier.setMonthlySummaryLimit(request.getMonthlySummaryLimit());
        tier.setDailyGenerationLimit(request.getDailyGenerationLimit());
        tier.setMonthlyGenerationLimit(request.getMonthlyGenerationLimit());
        tier.setEnabled(request.getEnabled() != null ? request.getEnabled() : Boolean.TRUE);
        tier.setUpdatedBy(findActor(actorUserId));
        return toResponse(aiQuotaTierRepository.save(tier));
    }

    @Transactional
    public void deleteTier(Long id) {
        AiQuotaTier tier = aiQuotaTierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AI_QUOTA_TIER_NOT_FOUND));
        aiQuotaTierRepository.delete(tier);
    }

    @Transactional(readOnly = true)
    public AiQuotaStatusResponse getQuotaStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        AiQuotaTier tier = resolveTier(user);

        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = today.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        long dailyChatUsed = count(userId, AiActionType.CHAT, dayStart, dayEnd);
        long monthlyChatUsed = count(userId, AiActionType.CHAT, monthStart, monthEnd);
        long dailySummaryUsed = count(userId, AiActionType.SUMMARY, dayStart, dayEnd);
        long monthlySummaryUsed = count(userId, AiActionType.SUMMARY, monthStart, monthEnd);
        long dailyGenerationUsed = countGeneration(userId, dayStart, dayEnd);
        long monthlyGenerationUsed = countGeneration(userId, monthStart, monthEnd);

        return AiQuotaStatusResponse.builder()
                .userId(userId)
                .reputationPoints(Optional.ofNullable(user.getReputationPoints()).orElse(0))
                .tier(toResponse(tier))
                .dailyChatUsed(dailyChatUsed)
                .monthlyChatUsed(monthlyChatUsed)
                .dailySummaryUsed(dailySummaryUsed)
                .monthlySummaryUsed(monthlySummaryUsed)
                .dailyGenerationUsed(dailyGenerationUsed)
                .monthlyGenerationUsed(monthlyGenerationUsed)
                .chatAvailable(dailyChatUsed < tier.getDailyChatLimit() && monthlyChatUsed < tier.getMonthlyChatLimit())
                .summaryAvailable(dailySummaryUsed < tier.getDailySummaryLimit()
                        && monthlySummaryUsed < tier.getMonthlySummaryLimit())
                .generationAvailable(dailyGenerationUsed < tier.getDailyGenerationLimit()
                        && monthlyGenerationUsed < tier.getMonthlyGenerationLimit())
                .build();
    }

    @Transactional(readOnly = true)
    public void assertQuotaAvailable(Long userId, AiActionType actionType) {
        assertQuotaAvailable(userId, actionType, 1);
    }

    @Transactional(readOnly = true)
    public void assertQuotaAvailable(Long userId, AiActionType actionType, int requestCount) {
        if (userId == null || actionType == null) {
            return;
        }
        int requiredRequests = Math.max(requestCount, 1);

        AiQuotaStatusResponse status = getQuotaStatus(userId);
        AiQuotaTierResponse tier = status.getTier();

        if (actionType == AiActionType.CHAT) {
            assertWithinLimit("chat", status.getDailyChatUsed(), tier.getDailyChatLimit(),
                    status.getMonthlyChatUsed(), tier.getMonthlyChatLimit(), requiredRequests);
        } else if (actionType == AiActionType.SUMMARY) {
            assertWithinLimit("summary", status.getDailySummaryUsed(), tier.getDailySummaryLimit(),
                    status.getMonthlySummaryUsed(), tier.getMonthlySummaryLimit(), requiredRequests);
        } else if (GENERATION_ACTIONS.contains(actionType)) {
            assertWithinLimit("generation", status.getDailyGenerationUsed(), tier.getDailyGenerationLimit(),
                    status.getMonthlyGenerationUsed(), tier.getMonthlyGenerationLimit(), requiredRequests);
        }
    }

    private AiQuotaTier resolveTier(User user) {
        int reputationPoints = Optional.ofNullable(user.getReputationPoints()).orElse(0);
        return aiQuotaTierRepository
                .findFirstByEnabledTrueAndMinReputationPointsLessThanEqualOrderByMinReputationPointsDesc(
                        reputationPoints)
                .orElseGet(this::fallbackTier);
    }

    private AiQuotaTier fallbackTier() {
        return AiQuotaTier.builder()
                .id(null)
                .name("Starter")
                .minReputationPoints(0)
                .dailyChatLimit(20)
                .monthlyChatLimit(600)
                .dailySummaryLimit(5)
                .monthlySummaryLimit(150)
                .dailyGenerationLimit(5)
                .monthlyGenerationLimit(150)
                .enabled(true)
                .build();
    }

    private long count(Long userId, AiActionType actionType, LocalDateTime from, LocalDateTime to) {
        return aiUsageLogsRepository.countByUser_IdAndActionTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                userId, actionType, from, to);
    }

    private long countGeneration(Long userId, LocalDateTime from, LocalDateTime to) {
        return aiUsageLogsRepository.countByUser_IdAndActionTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                userId, GENERATION_ACTIONS, from, to);
    }

    private void assertWithinLimit(String quotaName,
                                   long dailyUsed,
                                   int dailyLimit,
                                   long monthlyUsed,
                                   int monthlyLimit,
                                   int requiredRequests) {
        if (dailyUsed + requiredRequests > dailyLimit) {
            throw new AppException(ErrorCode.AI_QUOTA_EXCEEDED,
                    "Daily " + quotaName + " AI quota exceeded");
        }
        if (monthlyUsed + requiredRequests > monthlyLimit) {
            throw new AppException(ErrorCode.AI_QUOTA_EXCEEDED,
                    "Monthly " + quotaName + " AI quota exceeded");
        }
    }

    private void validateDuplicate(AiQuotaTierRequest request, Long currentId) {
        Long id = currentId == null ? -1L : currentId;
        if (aiQuotaTierRepository.existsByNameIgnoreCaseAndIdNot(normalizeName(request.getName()), id)
                || aiQuotaTierRepository.existsByMinReputationPointsAndIdNot(request.getMinReputationPoints(), id)) {
            throw new AppException(ErrorCode.AI_QUOTA_TIER_DUPLICATE);
        }
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tier name is required");
        }
        return name.trim();
    }

    private User findActor(Long actorUserId) {
        return actorUserId == null ? null : userRepository.findById(actorUserId).orElse(null);
    }

    private AiQuotaTierResponse toResponse(AiQuotaTier tier) {
        return AiQuotaTierResponse.builder()
                .id(tier.getId())
                .name(tier.getName())
                .minReputationPoints(tier.getMinReputationPoints())
                .dailyChatLimit(tier.getDailyChatLimit())
                .monthlyChatLimit(tier.getMonthlyChatLimit())
                .dailySummaryLimit(tier.getDailySummaryLimit())
                .monthlySummaryLimit(tier.getMonthlySummaryLimit())
                .dailyGenerationLimit(tier.getDailyGenerationLimit())
                .monthlyGenerationLimit(tier.getMonthlyGenerationLimit())
                .enabled(tier.getEnabled())
                .createdAt(tier.getCreatedAt())
                .updatedAt(tier.getUpdatedAt())
                .build();
    }
}
