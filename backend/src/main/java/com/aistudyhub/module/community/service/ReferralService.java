package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.ReferralStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Referral;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.ApplyReferralRequest;
import com.aistudyhub.module.community.dto.ReferralResponse;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.ReferralRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReferralService {

    private static final int CODE_PREFIX_MAX_LENGTH = 6;
    private static final String FALLBACK_CODE_PREFIX = "AIHUB";

    private final ReferralRepository referralRepository;
    private final UserRepository userRepository;
    private final SystemConfigService systemConfigService;
    private final RewardBadgeService rewardBadgeService;

    @Transactional
    public ReferralResponse getMyReferral(Long userId) {
        User user = getActiveUser(userId);
        return toResponse(ensureReferral(user));
    }

    @Transactional
    public ReferralResponse applyReferral(Long userId, ApplyReferralRequest request) {
        User currentUser = getActiveUser(userId);
        Referral myReferral = ensureReferral(currentUser);

        if (myReferral.getStatus() == ReferralStatus.APPLIED) {
            throw new AppException(ErrorCode.REFERRAL_ALREADY_APPLIED);
        }

        String referralCode = normalizeCode(request.getReferralCode());
        Referral targetReferral = referralRepository.findByCode(referralCode)
                .orElseThrow(() -> new AppException(ErrorCode.REFERRAL_CODE_INVALID));

        if (targetReferral.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.REFERRAL_SELF_APPLY);
        }

        int rewardPoints = getReferralRewardPoints();
        myReferral.setAppliedReferral(targetReferral);
        myReferral.setAppliedByUser(currentUser);
        myReferral.setStatus(ReferralStatus.APPLIED);
        myReferral.setRewardPoints(rewardPoints);
        myReferral.setAppliedAt(LocalDateTime.now());

        rewardUser(currentUser, rewardPoints);
        rewardUser(targetReferral.getOwner(), rewardPoints);
        rewardBadgeService.awardReferralBadges(currentUser, targetReferral.getOwner());

        return toResponse(myReferral);
    }

    private Referral ensureReferral(User user) {
        return referralRepository.findByOwner_Id(user.getId())
                .orElseGet(() -> referralRepository.save(Referral.builder()
                        .owner(user)
                        .code(generateUniqueCode(user))
                        .status(ReferralStatus.ACTIVE)
                        .rewardPoints(0)
                        .build()));
    }

    private User getActiveUser(Long userId) {
        return userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private int getReferralRewardPoints() {
        int rewardPoints = systemConfigService.getRequiredIntValue(SystemConfigKeys.GROWTH_REFERRAL_REWARD_POINTS);
        if (rewardPoints < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    SystemConfigKeys.GROWTH_REFERRAL_REWARD_POINTS + " must be greater than or equal to 0");
        }
        return rewardPoints;
    }

    private void rewardUser(User user, int rewardPoints) {
        int currentPoints = user.getReputationPoints() != null ? user.getReputationPoints() : 0;
        user.setReputationPoints(currentPoints + rewardPoints);
    }

    private String generateUniqueCode(User user) {
        String prefix = buildPrefix(user);
        String base = prefix + user.getId();
        String candidate = base;
        int suffix = 1;
        while (referralRepository.existsByCode(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String buildPrefix(User user) {
        String source = firstNonBlank(user.getFullName(), user.getEmail());
        String normalized = source.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (normalized.isBlank()) {
            normalized = FALLBACK_CODE_PREFIX;
        }
        if (normalized.length() > CODE_PREFIX_MAX_LENGTH) {
            return normalized.substring(0, CODE_PREFIX_MAX_LENGTH);
        }
        return normalized;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return FALLBACK_CODE_PREFIX;
    }

    private String normalizeCode(String referralCode) {
        return referralCode.trim().toUpperCase(Locale.ROOT);
    }

    private ReferralResponse toResponse(Referral referral) {
        return ReferralResponse.builder()
                .id(referral.getId())
                .code(referral.getCode())
                .appliedByUserId(referral.getAppliedByUser() != null ? referral.getAppliedByUser().getId() : null)
                .status(referral.getStatus())
                .rewardPoints(referral.getRewardPoints())
                .build();
    }
}
