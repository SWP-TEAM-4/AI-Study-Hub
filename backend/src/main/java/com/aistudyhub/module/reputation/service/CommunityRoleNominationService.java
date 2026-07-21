package com.aistudyhub.module.reputation.service;

import com.aistudyhub.common.enums.CommunityRoleNominationStatus;
import com.aistudyhub.common.enums.CommunityRoleNominationType;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.CommunityRoleNomination;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.CreateCommunityRoleRequest;
import com.aistudyhub.module.community.service.CommunityRoleService;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.reputation.dto.CommunityRoleNominationResponse;
import com.aistudyhub.module.reputation.dto.ReviewNominationRequest;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.CommunityRoleNominationRepository;
import com.aistudyhub.repository.ReputationEventRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.repository.projection.ReputationLeaderboardProjection;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunityRoleNominationService {

    private static final Set<ReputationEventType> CONTRIBUTOR_EVENTS = EnumSet.of(
            ReputationEventType.CONTENT_APPROVED_DOCUMENT,
            ReputationEventType.CONTENT_APPROVED_QUIZ,
            ReputationEventType.CONTENT_APPROVED_FLASHCARD_DECK,
            ReputationEventType.MARKETPLACE_CLONE_RECEIVED,
            ReputationEventType.CONTENT_DOWNLOAD_MILESTONE,
            ReputationEventType.COMMUNITY_REVIEW_GOOD,
            ReputationEventType.COMMUNITY_REVIEW_BAD,
            ReputationEventType.CONTENT_REPORT_ACCEPTED,
            ReputationEventType.CONTENT_REPORT_REJECTED,
            ReputationEventType.CONTENT_REPORT_OWNER_PENALTY,
            ReputationEventType.CONTENT_HIDDEN_PENALTY);

    private final CommunityRoleNominationRepository nominationRepository;
    private final ReputationEventRepository reputationEventRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final SystemConfigService systemConfigService;
    private final CommunityRoleService communityRoleService;
    private final NotificationService notificationService;

    @Transactional
    public List<CommunityRoleNominationResponse> generateMonthlyNominations(String rawPeriodKey) {
        String periodKey = normalizePeriodKeyOrDefault(rawPeriodKey, YearMonth.now().minusMonths(1));
        int moderatorLimit = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.COMMUNITY_MODERATOR_NOMINATION_LIMIT_PER_SUBJECT, 1);
        int reviewerLimit = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.COMMUNITY_REVIEWER_NOMINATION_LIMIT_PER_SUBJECT, 3);
        int reviewerEligiblePoints = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.COMMUNITY_REVIEWER_ELIGIBLE_POINTS, 100);

        List<CommunityRoleNominationResponse> created = new ArrayList<>();
        for (Subject subject : subjectRepository.findAllByOrderByCodeAsc()) {
            created.addAll(createTopModeratorNominations(subject, periodKey, moderatorLimit));
            created.addAll(createReviewerUnlockNominations(subject, periodKey, reviewerLimit, reviewerEligiblePoints));
        }
        return created;
    }

    @Transactional
    public CommunityRoleNominationResponse nominateReviewer(Long userId, Long subjectId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        String periodKey = YearMonth.now().toString();

        if (nominationRepository.existsByUser_IdAndRoleTypeAndScopeTypeAndScopeIdAndPeriodKey(
                userId,
                CommunityRoleType.MARKETPLACE_REVIEWER,
                CommunityScopeType.SUBJECT,
                subjectId,
                periodKey)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Reviewer nomination already exists");
        }

        CommunityRoleNomination nomination = CommunityRoleNomination.builder()
                .user(user)
                .subject(subject)
                .nominationType(CommunityRoleNominationType.REVIEWER_UNLOCK)
                .roleType(CommunityRoleType.MARKETPLACE_REVIEWER)
                .scopeType(CommunityScopeType.SUBJECT)
                .scopeId(subjectId)
                .periodKey(periodKey)
                .score(user.getReputationPoints() != null ? user.getReputationPoints() : 0)
                .status(CommunityRoleNominationStatus.PENDING)
                .reason(StringUtils.hasText(reason) ? reason.trim() : "Manual reviewer nomination")
                .build();

        CommunityRoleNomination saved = nominationRepository.save(nomination);
        notifyNominationCreated(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaginationResponse<CommunityRoleNominationResponse> search(
            Long userId,
            Long subjectId,
            String status,
            String nominationType,
            String roleType,
            String periodKey,
            int page,
            int size,
            String sort) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1),
                Sort.by(direction, "createdAt"));

        Specification<CommunityRoleNomination> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (subjectId != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), subjectId));
            }
            CommunityRoleNominationStatus parsedStatus = parseStatus(status);
            if (parsedStatus != null) {
                predicates.add(cb.equal(root.get("status"), parsedStatus));
            }
            CommunityRoleNominationType parsedNominationType = parseNominationType(nominationType);
            if (parsedNominationType != null) {
                predicates.add(cb.equal(root.get("nominationType"), parsedNominationType));
            }
            CommunityRoleType parsedRoleType = parseRoleType(roleType);
            if (parsedRoleType != null) {
                predicates.add(cb.equal(root.get("roleType"), parsedRoleType));
            }
            if (StringUtils.hasText(periodKey)) {
                predicates.add(cb.equal(root.get("periodKey"), periodKey.trim()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CommunityRoleNominationResponse> result = nominationRepository.findAll(spec, pageable)
                .map(this::toResponse);
        return PaginationResponse.of(result);
    }

    @Transactional
    public CommunityRoleNominationResponse approve(Long id, ReviewNominationRequest request, Long adminUserId) {
        CommunityRoleNomination nomination = nominationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMMUNITY_ROLE_NOMINATION_NOT_FOUND));
        if (nomination.getStatus() != CommunityRoleNominationStatus.PENDING) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_NOMINATION_PROCESSED);
        }

        CreateCommunityRoleRequest roleRequest = new CreateCommunityRoleRequest();
        roleRequest.setUserId(nomination.getUser().getId());
        roleRequest.setRoleType(nomination.getRoleType().name());
        roleRequest.setScopeType(nomination.getScopeType().name());
        roleRequest.setScopeId(nomination.getScopeId());
        roleRequest.setStartAt(request != null && request.getEffectiveStartAt() != null
                ? request.getEffectiveStartAt()
                : defaultEffectiveStart(nomination.getPeriodKey()));
        roleRequest.setEndAt(request != null && request.getEffectiveEndAt() != null
                ? request.getEffectiveEndAt()
                : defaultEffectiveEnd(nomination.getPeriodKey()));

        communityRoleService.grantRole(roleRequest, adminUserId);

        nomination.setStatus(CommunityRoleNominationStatus.APPROVED);
        nomination.setReviewedBy(userRepository.findById(adminUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
        nomination.setReviewedAt(LocalDateTime.now());
        nomination.setReviewNote(request != null ? request.getReviewNote() : null);
        nomination.setEffectiveStartAt(roleRequest.getStartAt());
        nomination.setEffectiveEndAt(roleRequest.getEndAt());
        CommunityRoleNomination saved = nominationRepository.save(nomination);
        notifyNominationReviewed(saved, true);
        return toResponse(saved);
    }

    @Transactional
    public CommunityRoleNominationResponse reject(Long id, ReviewNominationRequest request, Long adminUserId) {
        CommunityRoleNomination nomination = nominationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMMUNITY_ROLE_NOMINATION_NOT_FOUND));
        if (nomination.getStatus() != CommunityRoleNominationStatus.PENDING) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_NOMINATION_PROCESSED);
        }

        nomination.setStatus(CommunityRoleNominationStatus.REJECTED);
        nomination.setReviewedBy(userRepository.findById(adminUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
        nomination.setReviewedAt(LocalDateTime.now());
        nomination.setReviewNote(request != null ? request.getReviewNote() : null);
        CommunityRoleNomination saved = nominationRepository.save(nomination);
        notifyNominationReviewed(saved, false);
        return toResponse(saved);
    }

    private List<CommunityRoleNominationResponse> createTopModeratorNominations(
            Subject subject,
            String periodKey,
            int limit) {
        if (limit <= 0) {
            return List.of();
        }
        Page<ReputationLeaderboardProjection> leaderboard = reputationEventRepository.findLeaderboard(
                subject.getId(),
                periodKey,
                CONTRIBUTOR_EVENTS,
                PageRequest.of(0, limit));
        return leaderboard.getContent()
                .stream()
                .filter(item -> item.getScore() != null && item.getScore() > 0)
                .map(item -> createNominationIfAbsent(
                        item,
                        subject,
                        periodKey,
                        CommunityRoleNominationType.MONTHLY_TOP_CONTRIBUTOR,
                        CommunityRoleType.SUBJECT_MODERATOR,
                        "Top contributor for " + subject.getCode() + " in " + periodKey))
                .filter(response -> response != null)
                .toList();
    }

    private List<CommunityRoleNominationResponse> createReviewerUnlockNominations(
            Subject subject,
            String periodKey,
            int limit,
            int eligiblePoints) {
        if (limit <= 0) {
            return List.of();
        }
        Page<ReputationLeaderboardProjection> leaderboard = reputationEventRepository.findLeaderboard(
                subject.getId(),
                periodKey,
                CONTRIBUTOR_EVENTS,
                PageRequest.of(0, Math.max(limit * 3, limit)));
        return leaderboard.getContent()
                .stream()
                .filter(item -> item.getScore() != null && item.getScore() > 0)
                .filter(item -> userRepository.findById(item.getUserId())
                        .map(user -> user.getReputationPoints() != null && user.getReputationPoints() >= eligiblePoints)
                        .orElse(false))
                .limit(limit)
                .map(item -> createNominationIfAbsent(
                        item,
                        subject,
                        periodKey,
                        CommunityRoleNominationType.REVIEWER_UNLOCK,
                        CommunityRoleType.MARKETPLACE_REVIEWER,
                        "Reviewer unlock candidate for " + subject.getCode()
                                + " with reputation >= " + eligiblePoints))
                .filter(response -> response != null)
                .toList();
    }

    private CommunityRoleNominationResponse createNominationIfAbsent(
            ReputationLeaderboardProjection item,
            Subject subject,
            String periodKey,
            CommunityRoleNominationType nominationType,
            CommunityRoleType roleType,
            String reason) {
        if (item.getUserId() == null) {
            return null;
        }
        if (nominationRepository.existsByUser_IdAndRoleTypeAndScopeTypeAndScopeIdAndPeriodKey(
                item.getUserId(), roleType, CommunityScopeType.SUBJECT, subject.getId(), periodKey)) {
            return null;
        }

        User user = userRepository.findById(item.getUserId()).orElse(null);
        if (user == null) {
            return null;
        }

        CommunityRoleNomination nomination = CommunityRoleNomination.builder()
                .user(user)
                .subject(subject)
                .nominationType(nominationType)
                .roleType(roleType)
                .scopeType(CommunityScopeType.SUBJECT)
                .scopeId(subject.getId())
                .periodKey(periodKey)
                .score(clampToInt(item.getScore()))
                .status(CommunityRoleNominationStatus.PENDING)
                .reason(reason)
                .effectiveStartAt(defaultEffectiveStart(periodKey))
                .effectiveEndAt(defaultEffectiveEnd(periodKey))
                .build();
        CommunityRoleNomination saved = nominationRepository.save(nomination);
        notifyNominationCreated(saved);
        return toResponse(saved);
    }

    private LocalDateTime defaultEffectiveStart(String periodKey) {
        return YearMonth.parse(periodKey).plusMonths(1).atDay(1).atStartOfDay();
    }

    private int clampToInt(Long value) {
        if (value == null) {
            return 0;
        }
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return value.intValue();
    }

    private LocalDateTime defaultEffectiveEnd(String periodKey) {
        return YearMonth.parse(periodKey).plusMonths(2).atDay(1).atStartOfDay().minusSeconds(1);
    }

    private String normalizePeriodKeyOrDefault(String rawPeriodKey, YearMonth fallback) {
        if (!StringUtils.hasText(rawPeriodKey)) {
            return fallback.toString();
        }
        try {
            return YearMonth.parse(rawPeriodKey.trim()).toString();
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "periodKey must use yyyy-MM format");
        }
    }

    private CommunityRoleNominationStatus parseStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return CommunityRoleNominationStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid nomination status: " + raw);
        }
    }

    private CommunityRoleNominationType parseNominationType(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return CommunityRoleNominationType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid nomination type: " + raw);
        }
    }

    private CommunityRoleType parseRoleType(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return CommunityRoleType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid role type: " + raw);
        }
    }

    private CommunityRoleNominationResponse toResponse(CommunityRoleNomination nomination) {
        return CommunityRoleNominationResponse.builder()
                .id(nomination.getId())
                .userId(nomination.getUser() != null ? nomination.getUser().getId() : null)
                .userFullName(nomination.getUser() != null ? nomination.getUser().getFullName() : null)
                .subjectId(nomination.getSubject() != null ? nomination.getSubject().getId() : null)
                .subjectCode(nomination.getSubject() != null ? nomination.getSubject().getCode() : null)
                .nominationType(nomination.getNominationType())
                .roleType(nomination.getRoleType())
                .scopeType(nomination.getScopeType())
                .scopeId(nomination.getScopeId())
                .periodKey(nomination.getPeriodKey())
                .score(nomination.getScore())
                .status(nomination.getStatus())
                .reason(nomination.getReason())
                .effectiveStartAt(nomination.getEffectiveStartAt())
                .effectiveEndAt(nomination.getEffectiveEndAt())
                .reviewedByUserId(nomination.getReviewedBy() != null ? nomination.getReviewedBy().getId() : null)
                .reviewedAt(nomination.getReviewedAt())
                .reviewNote(nomination.getReviewNote())
                .createdAt(nomination.getCreatedAt())
                .build();
    }

    private void notifyNominationCreated(CommunityRoleNomination nomination) {
        if (nomination == null || nomination.getUser() == null || nomination.getUser().getId() == null) {
            return;
        }

        try {
            notificationService.createNotification(
                    nomination.getUser().getId(),
                    "Bạn được đề cử vai trò cộng đồng",
                    buildNominationMessage(nomination, "Đề cử đang chờ admin duyệt."));
        } catch (Exception ex) {
            log.warn("Failed to create nomination notification id={}: {}",
                    nomination.getId(), ex.getMessage());
        }
    }

    private void notifyNominationReviewed(CommunityRoleNomination nomination, boolean approved) {
        if (nomination == null || nomination.getUser() == null || nomination.getUser().getId() == null) {
            return;
        }

        try {
            notificationService.createNotification(
                    nomination.getUser().getId(),
                    approved ? "Đề cử cộng đồng đã được duyệt" : "Đề cử cộng đồng chưa được duyệt",
                    buildNominationMessage(nomination,
                            approved
                                    ? "Bạn đã được cấp quyền theo phạm vi được duyệt."
                                    : "Admin đã từ chối đề cử ở lần xét này."));
        } catch (Exception ex) {
            log.warn("Failed to create nomination review notification id={}: {}",
                    nomination.getId(), ex.getMessage());
        }
    }

    private String buildNominationMessage(CommunityRoleNomination nomination, String suffix) {
        String subject = nomination.getSubject() != null
                ? nomination.getSubject().getCode()
                : "toàn hệ thống";
        String role = nomination.getRoleType() != null ? nomination.getRoleType().name() : "COMMUNITY_ROLE";
        String period = StringUtils.hasText(nomination.getPeriodKey()) ? nomination.getPeriodKey() : "hiện tại";
        String note = StringUtils.hasText(nomination.getReviewNote())
                ? " Ghi chú: " + nomination.getReviewNote().trim()
                : "";
        return "Vai trò " + role + " cho môn/phạm vi " + subject + " kỳ " + period + ". " + suffix + note;
    }
}
