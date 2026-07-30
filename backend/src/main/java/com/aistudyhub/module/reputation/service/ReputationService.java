package com.aistudyhub.module.reputation.service;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ReputationEvent;
import com.aistudyhub.entity.RewardRule;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserBadge;
import com.aistudyhub.module.badge.dto.BadgeResponse;
import com.aistudyhub.module.community.service.RewardBadgeService;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.reputation.dto.ReputationEventResponse;
import com.aistudyhub.module.reputation.dto.ReputationLeaderboardItemResponse;
import com.aistudyhub.module.reputation.dto.RewardRuleRequest;
import com.aistudyhub.module.reputation.dto.RewardRuleResponse;
import com.aistudyhub.repository.ReputationEventRepository;
import com.aistudyhub.repository.RewardRuleRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.repository.projection.ReputationLeaderboardProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReputationService {

    private final RewardRuleRepository rewardRuleRepository;
    private final ReputationEventRepository reputationEventRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final RewardBadgeService rewardBadgeService;
    private final NotificationService notificationService;

    @Transactional
    public ReputationEventResponse applyConfiguredEvent(
            Long userId,
            Long subjectId,
            ReputationEventType eventType,
            String targetType,
            Long targetId,
            String sourceType,
            Long sourceId,
            String reason,
            String idempotencyKey,
            Long actorUserId) {

        if (userId == null || eventType == null || !StringUtils.hasText(idempotencyKey)) {
            return null;
        }

        RewardRule rule = rewardRuleRepository.findByEventType(eventType).orElse(null);
        if (rule == null || !Boolean.TRUE.equals(rule.getEnabled())) {
            return null;
        }

        int pointsDelta = Optional.ofNullable(rule.getPointsDelta()).orElse(0);
        if (pointsDelta == 0) {
            return null;
        }

        // Serialize reward writes per user so concurrent requests cannot both pass
        // the idempotency check before either transaction inserts its event.
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Optional<ReputationEvent> existing = reputationEventRepository.findByIdempotencyKey(idempotencyKey.trim());
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        String periodKey = currentPeriodKey();
        Integer maxPerPeriod = rule.getMaxEventsPerUserPerPeriod();
        if (maxPerPeriod != null && maxPerPeriod > 0) {
            long used = reputationEventRepository.countByUser_IdAndEventTypeAndPeriodKey(userId, eventType, periodKey);
            if (used >= maxPerPeriod) {
                return null;
            }
        }

        Subject subject = subjectId == null ? null : subjectRepository.findById(subjectId).orElse(null);
        User actor = actorUserId == null ? null : userRepository.findById(actorUserId).orElse(null);

        ReputationEvent event = ReputationEvent.builder()
                .user(user)
                .subject(subject)
                .eventType(eventType)
                .targetType(normalizeCode(targetType))
                .targetId(targetId)
                .sourceType(normalizeCode(sourceType))
                .sourceId(sourceId)
                .pointsDelta(pointsDelta)
                .reason(StringUtils.hasText(reason) ? reason.trim() : null)
                .idempotencyKey(idempotencyKey.trim())
                .periodKey(periodKey)
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .build();

        ReputationEvent saved = reputationEventRepository.save(event);
        int currentPoints = Optional.ofNullable(user.getReputationPoints()).orElse(0);
        user.setReputationPoints(Math.max(0, currentPoints + pointsDelta));
        userRepository.save(user);
        rewardBadgeService.awardReputationMilestoneBadge(user);
        notifyReputationEvent(user, saved);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RewardRuleResponse> getRules() {
        return rewardRuleRepository.findAllByOrderByEventTypeAsc()
                .stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Transactional
    public RewardRuleResponse updateRule(ReputationEventType eventType, RewardRuleRequest request, Long actorUserId) {
        RewardRule rule = rewardRuleRepository.findByEventType(eventType)
                .orElseThrow(() -> new AppException(ErrorCode.REWARD_RULE_NOT_FOUND));

        rule.setPointsDelta(request.getPointsDelta());
        rule.setEnabled(request.getEnabled() != null ? request.getEnabled() : Boolean.TRUE);
        rule.setMaxEventsPerUserPerPeriod(request.getMaxEventsPerUserPerPeriod());
        rule.setThresholdValue(request.getThresholdValue());
        rule.setMinRating(request.getMinRating());
        rule.setMaxRating(request.getMaxRating());
        rule.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        if (actorUserId != null) {
            userRepository.findById(actorUserId).ifPresent(rule::setUpdatedBy);
        }
        return toRuleResponse(rewardRuleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public Page<ReputationEventResponse> getUserEvents(Long userId, Pageable pageable) {
        userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return reputationEventRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReputationLeaderboardItemResponse> getLeaderboard(
            Long subjectId,
            String periodKey,
            Collection<ReputationEventType> eventTypes,
            int page,
            int size) {

        if (eventTypes == null || eventTypes.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "eventTypes must not be empty");
        }

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        String normalizedPeriod = StringUtils.hasText(periodKey) ? periodKey.trim() : currentPeriodKey();
        Page<ReputationLeaderboardProjection> leaderboard =
                reputationEventRepository.findLeaderboard(subjectId, normalizedPeriod, eventTypes, pageable);

        int firstRank = (int) pageable.getOffset() + 1;
        List<ReputationLeaderboardProjection> projections = leaderboard.getContent();
        Map<Long, List<BadgeResponse>> badgesByUserId = loadBadgesByUserId(projections.stream()
                .map(ReputationLeaderboardProjection::getUserId)
                .filter(java.util.Objects::nonNull)
                .toList());

        List<ReputationLeaderboardItemResponse> items = new java.util.ArrayList<>();
        for (int i = 0; i < projections.size(); i++) {
            items.add(toLeaderboardResponse(projections.get(i), firstRank + i, badgesByUserId));
        }

        return new PageImpl<>(items, pageable, leaderboard.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Integer getRuleThreshold(ReputationEventType eventType) {
        return rewardRuleRepository.findByEventType(eventType)
                .map(RewardRule::getThresholdValue)
                .filter(value -> value > 0)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public RewardRule getRuleOrNull(ReputationEventType eventType) {
        return rewardRuleRepository.findByEventType(eventType).orElse(null);
    }

    public String currentPeriodKey() {
        return YearMonth.now().toString();
    }

    public ReputationEventResponse toResponse(ReputationEvent event) {
        if (event == null) {
            return null;
        }
        return ReputationEventResponse.builder()
                .id(event.getId())
                .userId(event.getUser() != null ? event.getUser().getId() : null)
                .subjectId(event.getSubject() != null ? event.getSubject().getId() : null)
                .eventType(event.getEventType())
                .targetType(event.getTargetType())
                .targetId(event.getTargetId())
                .sourceType(event.getSourceType())
                .sourceId(event.getSourceId())
                .pointsDelta(event.getPointsDelta())
                .reason(event.getReason())
                .displayTitle(resolveDisplayTitle(event.getEventType()))
                .displayMessage(resolveDisplayMessage(event))
                .periodKey(event.getPeriodKey())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private RewardRuleResponse toRuleResponse(RewardRule rule) {
        return RewardRuleResponse.builder()
                .id(rule.getId())
                .eventType(rule.getEventType())
                .pointsDelta(rule.getPointsDelta())
                .enabled(rule.getEnabled())
                .maxEventsPerUserPerPeriod(rule.getMaxEventsPerUserPerPeriod())
                .thresholdValue(rule.getThresholdValue())
                .minRating(rule.getMinRating())
                .maxRating(rule.getMaxRating())
                .description(rule.getDescription())
                .updatedByUserId(rule.getUpdatedBy() != null ? rule.getUpdatedBy().getId() : null)
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }

    private ReputationLeaderboardItemResponse toLeaderboardResponse(
            ReputationLeaderboardProjection projection,
            int rank,
            Map<Long, List<BadgeResponse>> badgesByUserId) {
        return ReputationLeaderboardItemResponse.builder()
                .rank(rank)
                .userId(projection.getUserId())
                .fullName(projection.getFullName())
                .avatarUrl(projection.getAvatarUrl())
                .score(Optional.ofNullable(projection.getScore()).orElse(0L))
                .eventCount(Optional.ofNullable(projection.getEventCount()).orElse(0L))
                .badges(badgesByUserId.getOrDefault(projection.getUserId(), List.of()))
                .build();
    }

    private Map<Long, List<BadgeResponse>> loadBadgesByUserId(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return userBadgeRepository.findAllByUser_IdInOrderByEarnedAtDescIdDesc(userIds).stream()
                .filter(userBadge -> userBadge.getUser() != null && userBadge.getBadge() != null)
                .collect(Collectors.groupingBy(
                        userBadge -> userBadge.getUser().getId(),
                        Collectors.mapping(this::toBadgeResponse, Collectors.toList())));
    }

    private BadgeResponse toBadgeResponse(UserBadge userBadge) {
        return BadgeResponse.builder()
                .id(userBadge.getBadge().getId())
                .name(userBadge.getBadge().getName())
                .description(userBadge.getBadge().getDescription())
                .iconUrl(userBadge.getBadge().getIconUrl())
                .createdAt(userBadge.getBadge().getCreatedAt())
                .build();
    }

    private String normalizeCode(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase() : null;
    }

    private void notifyReputationEvent(User user, ReputationEvent event) {
        if (user == null || user.getId() == null || event == null || event.getPointsDelta() == null) {
            return;
        }

        try {
            int delta = event.getPointsDelta();
            String title = delta >= 0
                    ? "Bạn được cộng " + delta + " điểm uy tín"
                    : "Bạn bị trừ " + Math.abs(delta) + " điểm uy tín";
            notificationService.createNotification(
                    user.getId(),
                    title,
                    resolveDisplayMessage(event));
        } catch (Exception ex) {
            log.warn("Failed to create reputation notification for userId={}: {}", user.getId(), ex.getMessage());
        }
    }

    private String resolveDisplayTitle(ReputationEventType eventType) {
        if (eventType == null) {
            return "Điểm uy tín được cập nhật";
        }
        return switch (eventType) {
            case DAILY_LOGIN -> "Thưởng đăng nhập hằng ngày";
            case CONTENT_APPROVED_DOCUMENT -> "Tài liệu được duyệt";
            case CONTENT_APPROVED_QUIZ -> "Quiz được duyệt";
            case CONTENT_APPROVED_FLASHCARD_DECK -> "Flashcard được duyệt";
            case MARKETPLACE_CLONE_RECEIVED -> "Có lượt clone từ cộng đồng";
            case CONTENT_DOWNLOAD_MILESTONE -> "Đạt mốc lượt clone/download";
            case COMMUNITY_REVIEW_GOOD -> "Nội dung được đánh giá tốt";
            case COMMUNITY_REVIEW_BAD -> "Nội dung bị đánh giá thấp";
            case REVIEWER_MARKETPLACE_VOTE -> "Hoàn thành lượt duyệt marketplace";
            case REVIEWER_DECISION_ALIGNED -> "Duyệt khớp quyết định cuối";
            case CONTENT_REPORT_ACCEPTED -> "Báo cáo vi phạm hợp lệ";
            case CONTENT_REPORT_REJECTED -> "Báo cáo vi phạm bị từ chối";
            case CONTENT_REPORT_OWNER_PENALTY -> "Nội dung bị báo cáo xấu";
            case CONTENT_HIDDEN_PENALTY -> "Nội dung bị ẩn";
        };
    }

    private String resolveDisplayMessage(ReputationEvent event) {
        String title = resolveDisplayTitle(event.getEventType());
        String delta = event.getPointsDelta() == null
                ? ""
                : (event.getPointsDelta() >= 0 ? "+" : "") + event.getPointsDelta() + " điểm";
        String reason = StringUtils.hasText(event.getReason()) ? event.getReason().trim() : title;
        String target = StringUtils.hasText(event.getTargetType()) && event.getTargetId() != null
                ? " (" + event.getTargetType() + " #" + event.getTargetId() + ")"
                : "";
        return title + target + ": " + delta + ". " + reason;
    }
}
