package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.ContributorLeaderboardItemResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.repository.projection.UserContributionStatsProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ContributorLeaderboardService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;

    @Transactional(readOnly = true)
    public PaginationResponse<ContributorLeaderboardItemResponse> getContributorLeaderboard(int page, int size) {
        int normalizedPage = Math.max(page, DEFAULT_PAGE);
        int normalizedSize = normalizeSize(size);

        Map<Long, ContributorAccumulator> contributors = new LinkedHashMap<>();
        for (User user : userRepository.findAllByIsActiveTrueAndRoleNot(Role.ADMIN)) {
            contributors.put(user.getId(), new ContributorAccumulator(user));
        }

        mergeContentStats(contributors,
                documentRepository.summarizeApprovedContentByUser(Visibility.MARKETPLACE, MarketStatus.APPROVED));
        mergeContentStats(contributors,
                quizRepository.summarizeApprovedContentByUser(Visibility.MARKETPLACE, MarketStatus.APPROVED));
        mergeContentStats(contributors,
                flashcardDeckRepository.summarizeApprovedContentByUser(Visibility.MARKETPLACE, MarketStatus.APPROVED));

        List<ContributorAccumulator> sortedContributors = contributors.values().stream()
                .filter(ContributorAccumulator::shouldAppearOnLeaderboard)
                .sorted(buildComparator())
                .toList();

        if (sortedContributors.isEmpty()) {
            return PaginationResponse.of(List.of(), normalizedPage, normalizedSize, 0);
        }

        List<ContributorLeaderboardItemResponse> rankedItems = new ArrayList<>(sortedContributors.size());
        for (int i = 0; i < sortedContributors.size(); i++) {
            rankedItems.add(sortedContributors.get(i).toResponse(i + 1));
        }

        int totalElements = rankedItems.size();
        int start = normalizedPage * normalizedSize;
        if (start >= totalElements) {
            return PaginationResponse.of(List.of(), normalizedPage, normalizedSize, totalElements);
        }

        int end = Math.min(start + normalizedSize, totalElements);
        return PaginationResponse.of(rankedItems.subList(start, end), normalizedPage, normalizedSize, totalElements);
    }

    private void mergeContentStats(Map<Long, ContributorAccumulator> contributors,
            List<UserContributionStatsProjection> stats) {
        for (UserContributionStatsProjection stat : stats) {
            ContributorAccumulator contributor = contributors.get(stat.getUserId());
            if (contributor == null) {
                continue;
            }
            contributor.merge(stat);
        }
    }

    private Comparator<ContributorAccumulator> buildComparator() {
        return Comparator.comparingInt(ContributorAccumulator::getReputationPoints).reversed()
                .thenComparing(Comparator.comparingLong(ContributorAccumulator::getTotalDownloads).reversed())
                .thenComparing(Comparator.comparingLong(ContributorAccumulator::getTotalReviewCount).reversed())
                .thenComparing(Comparator.comparing(ContributorAccumulator::getAverageAcceptPercentage).reversed())
                .thenComparing(Comparator.comparingLong(ContributorAccumulator::getApprovedContents).reversed())
                .thenComparingLong(ContributorAccumulator::getUserId);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private static final class ContributorAccumulator {

        private final User user;
        private long approvedContents;
        private long totalDownloads;
        private long totalReviewCount;
        private BigDecimal totalAcceptPercentage = BigDecimal.ZERO;

        private ContributorAccumulator(User user) {
            this.user = user;
        }

        private void merge(UserContributionStatsProjection stats) {
            this.approvedContents += safeLong(stats.getApprovedContents());
            this.totalDownloads += safeLong(stats.getTotalDownloads());
            this.totalReviewCount += safeLong(stats.getTotalReviewCount());
            this.totalAcceptPercentage = this.totalAcceptPercentage.add(safeBigDecimal(stats.getTotalAcceptPercentage()));
        }

        private boolean shouldAppearOnLeaderboard() {
            return approvedContents > 0 || getReputationPoints() > 0;
        }

        private int getReputationPoints() {
            return user.getReputationPoints() != null ? user.getReputationPoints() : 0;
        }

        private long getApprovedContents() {
            return approvedContents;
        }

        private long getTotalDownloads() {
            return totalDownloads;
        }

        private long getTotalReviewCount() {
            return totalReviewCount;
        }

        private long getUserId() {
            return user.getId();
        }

        private BigDecimal getAverageAcceptPercentage() {
            if (approvedContents <= 0) {
                return BigDecimal.ZERO;
            }
            return totalAcceptPercentage.divide(BigDecimal.valueOf(approvedContents), 2, RoundingMode.HALF_UP);
        }

        private ContributorLeaderboardItemResponse toResponse(int rank) {
            return ContributorLeaderboardItemResponse.builder()
                    .rank(rank)
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .reputationPoints(getReputationPoints())
                    .approvedContents(approvedContents)
                    .downloadCount(totalDownloads)
                    .reviewCount(totalReviewCount)
                    .acceptPercentage(getAverageAcceptPercentage())
                    .build();
        }

        private long safeLong(Number value) {
            return value == null ? 0L : value.longValue();
        }

        private BigDecimal safeBigDecimal(BigDecimal value) {
            return value != null ? value : BigDecimal.ZERO;
        }
    }
}
