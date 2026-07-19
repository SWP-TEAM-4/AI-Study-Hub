package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.ReferralStatus;
import com.aistudyhub.entity.Badge;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserBadge;
import com.aistudyhub.module.community.dto.ContributorLeaderboardItemResponse;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.BadgeRepository;
import com.aistudyhub.repository.MarketReviewRepository;
import com.aistudyhub.repository.ReferralRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RewardBadgeService {

    private static final int DEFAULT_TOP_CONTRIBUTOR_LIMIT = 10;
    private static final int DEFAULT_MARKETPLACE_CONTRIBUTOR_CONTENTS = 3;
    private static final int DEFAULT_POPULAR_CREATOR_DOWNLOADS = 50;
    private static final int DEFAULT_TOP_REVIEWER_REVIEWS = 10;
    private static final int DEFAULT_REFERRAL_AMBASSADOR_INVITES = 5;
    private static final int DEFAULT_REPUTATION_MILESTONE_POINTS = 100;

    private static final AutoBadge TOP_CONTRIBUTOR = new AutoBadge(
            "Top Contributor",
            "Awarded automatically to users in the top contributor leaderboard.",
            "/badges/top-contributor.svg");
    private static final AutoBadge FIRST_APPROVED_CONTENT = new AutoBadge(
            "First Approved Content",
            "Awarded automatically after a user's first approved marketplace content.",
            "/badges/first-approved-content.svg");
    private static final AutoBadge MARKETPLACE_CONTRIBUTOR = new AutoBadge(
            "Marketplace Contributor",
            "Awarded automatically after contributing multiple approved marketplace items.",
            "/badges/marketplace-contributor.svg");
    private static final AutoBadge POPULAR_CREATOR = new AutoBadge(
            "Popular Creator",
            "Awarded automatically when a user's marketplace content reaches a download milestone.",
            "/badges/popular-creator.svg");
    private static final AutoBadge TOP_REVIEWER = new AutoBadge(
            "Top Reviewer",
            "Awarded automatically after completing a marketplace review milestone.",
            "/badges/top-reviewer.svg");
    private static final AutoBadge REFERRAL_STARTER = new AutoBadge(
            "Referral Starter",
            "Awarded automatically after applying a valid referral code.",
            "/badges/referral-starter.svg");
    private static final AutoBadge REFERRAL_AMBASSADOR = new AutoBadge(
            "Referral Ambassador",
            "Awarded automatically after inviting enough users with a referral code.",
            "/badges/referral-ambassador.svg");
    private static final AutoBadge REPUTATION_MILESTONE = new AutoBadge(
            "Reputation Milestone",
            "Awarded automatically after reaching the configured reputation milestone.",
            "/badges/reputation-milestone.svg");

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final ReferralRepository referralRepository;
    private final MarketReviewRepository marketReviewRepository;
    private final SystemConfigService systemConfigService;

    @Transactional
    public void awardContributorBadges(List<ContributorLeaderboardItemResponse> rankedItems) {
        if (rankedItems == null || rankedItems.isEmpty()) {
            return;
        }

        int topLimit = configuredInt(SystemConfigKeys.GROWTH_TOP_CONTRIBUTOR_LIMIT,
                DEFAULT_TOP_CONTRIBUTOR_LIMIT);
        int contributorThreshold = configuredInt(SystemConfigKeys.REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS,
                DEFAULT_MARKETPLACE_CONTRIBUTOR_CONTENTS);
        int popularCreatorDownloads = configuredInt(SystemConfigKeys.REWARD_POPULAR_CREATOR_DOWNLOADS,
                DEFAULT_POPULAR_CREATOR_DOWNLOADS);

        for (ContributorLeaderboardItemResponse item : rankedItems) {
            userRepository.findByIdAndIsActiveTrue(item.getUserId()).ifPresent(user -> {
                if (topLimit > 0 && item.getRank() != null && item.getRank() <= topLimit) {
                    awardBadgeIfMissing(user, TOP_CONTRIBUTOR);
                }
                if (safeLong(item.getApprovedContents()) > 0) {
                    awardBadgeIfMissing(user, FIRST_APPROVED_CONTENT);
                }
                if (contributorThreshold > 0 && safeLong(item.getApprovedContents()) >= contributorThreshold) {
                    awardBadgeIfMissing(user, MARKETPLACE_CONTRIBUTOR);
                }
                if (popularCreatorDownloads > 0 && safeLong(item.getDownloadCount()) >= popularCreatorDownloads) {
                    awardBadgeIfMissing(user, POPULAR_CREATOR);
                }
                awardReputationMilestoneIfReached(user);
            });
        }
    }

    @Transactional
    public void awardReferralBadges(User invitee, User inviter) {
        awardBadgeIfMissing(invitee, REFERRAL_STARTER);

        int ambassadorInvites = configuredInt(SystemConfigKeys.GROWTH_REFERRAL_AMBASSADOR_INVITES,
                DEFAULT_REFERRAL_AMBASSADOR_INVITES);
        long successfulInvites = referralRepository.countByAppliedReferral_Owner_IdAndStatus(
                inviter.getId(),
                ReferralStatus.APPLIED);
        if (ambassadorInvites > 0 && successfulInvites >= ambassadorInvites) {
            awardBadgeIfMissing(inviter, REFERRAL_AMBASSADOR);
        }

        awardReputationMilestoneIfReached(invitee);
        awardReputationMilestoneIfReached(inviter);
    }

    @Transactional
    public void awardReviewerBadges(User reviewer) {
        int reviewerThreshold = configuredInt(SystemConfigKeys.REWARD_TOP_REVIEWER_REVIEWS,
                DEFAULT_TOP_REVIEWER_REVIEWS);
        long completedReviews = marketReviewRepository.countByReviewerIdAndVoteResultIsNotNull(reviewer.getId());
        if (reviewerThreshold > 0 && completedReviews >= reviewerThreshold) {
            awardBadgeIfMissing(reviewer, TOP_REVIEWER);
        }
        awardReputationMilestoneIfReached(reviewer);
    }

    private void awardReputationMilestoneIfReached(User user) {
        int reputationThreshold = configuredInt(SystemConfigKeys.REWARD_REPUTATION_MILESTONE_POINTS,
                DEFAULT_REPUTATION_MILESTONE_POINTS);
        int reputationPoints = user.getReputationPoints() != null ? user.getReputationPoints() : 0;
        if (reputationThreshold > 0 && reputationPoints >= reputationThreshold) {
            awardBadgeIfMissing(user, REPUTATION_MILESTONE);
        }
    }

    private void awardBadgeIfMissing(User user, AutoBadge autoBadge) {
        if (user == null || user.getId() == null) {
            return;
        }

        Badge badge = getOrCreateBadge(autoBadge);
        if (userBadgeRepository.existsByUser_IdAndBadge_Id(user.getId(), badge.getId())) {
            return;
        }

        try {
            userBadgeRepository.save(UserBadge.builder()
                    .user(user)
                    .badge(badge)
                    .build());
            log.info("Auto-assigned badge '{}' to userId={}", badge.getName(), user.getId());
        } catch (DataIntegrityViolationException ex) {
            log.debug("Badge '{}' was already assigned to userId={}", badge.getName(), user.getId());
        }
    }

    private Badge getOrCreateBadge(AutoBadge autoBadge) {
        return badgeRepository.findFirstByNameIgnoreCaseOrderByIdAsc(autoBadge.name())
                .orElseGet(() -> badgeRepository.save(Badge.builder()
                        .name(autoBadge.name())
                        .description(autoBadge.description())
                        .iconUrl(autoBadge.iconUrl())
                        .build()));
    }

    private int configuredInt(String key, int defaultValue) {
        return systemConfigService.getIntValueOrDefault(key, defaultValue);
    }

    private long safeLong(Number value) {
        return value == null ? 0L : value.longValue();
    }

    private record AutoBadge(String name, String description, String iconUrl) {
    }
}
