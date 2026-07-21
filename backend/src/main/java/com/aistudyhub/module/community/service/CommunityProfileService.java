package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.MarketReview;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.badge.service.BadgeService;
import com.aistudyhub.module.community.dto.CommunityProfileContributionResponse;
import com.aistudyhub.module.community.dto.CommunityProfileResponse;
import com.aistudyhub.module.community.dto.CommunityProfileReviewResponse;
import com.aistudyhub.module.community.dto.CommunityProfileSubjectResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.MarketReviewRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.ReputationEventRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.repository.projection.UserTopSubjectProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CommunityProfileService {

    private static final int PROFILE_SECTION_LIMIT = 8;

    private final UserRepository userRepository;
    private final BadgeService badgeService;
    private final ReputationEventRepository reputationEventRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final MarketReviewRepository marketReviewRepository;

    @Transactional(readOnly = true)
    public CommunityProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return CommunityProfileResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .reputationPoints(Optional.ofNullable(user.getReputationPoints()).orElse(0))
                .joinedAt(user.getCreatedAt())
                .badges(badgeService.getUserBadges(user.getId()))
                .topSubjects(loadTopSubjects(user.getId()))
                .contributions(loadContributions(user.getId()))
                .reviewHistory(loadReviewHistory(user.getId()))
                .build();
    }

    private List<CommunityProfileSubjectResponse> loadTopSubjects(Long userId) {
        return reputationEventRepository.findTopSubjectsByUserId(
                        userId,
                        PageRequest.of(0, 5))
                .stream()
                .map(this::toSubjectResponse)
                .toList();
    }

    private List<CommunityProfileContributionResponse> loadContributions(Long userId) {
        PageRequest page = PageRequest.of(0, PROFILE_SECTION_LIMIT);
        List<CommunityProfileContributionResponse> documents = documentRepository
                .findByUserIdAndVisibilityAndMarketStatusOrderByUpdatedAtDesc(
                        userId, Visibility.MARKETPLACE, MarketStatus.APPROVED, page)
                .stream()
                .map(this::toContribution)
                .toList();
        List<CommunityProfileContributionResponse> quizzes = quizRepository
                .findByCreatorIdAndVisibilityAndMarketStatusOrderByUpdatedAtDesc(
                        userId, Visibility.MARKETPLACE, MarketStatus.APPROVED, page)
                .stream()
                .map(this::toContribution)
                .toList();
        List<CommunityProfileContributionResponse> decks = flashcardDeckRepository
                .findByUserIdAndVisibilityAndMarketStatusOrderByUpdatedAtDesc(
                        userId, Visibility.MARKETPLACE, MarketStatus.APPROVED, page)
                .stream()
                .map(this::toContribution)
                .toList();

        return Stream.of(documents, quizzes, decks)
                .flatMap(List::stream)
                .sorted(Comparator.comparing(
                        CommunityProfileContributionResponse::getApprovedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(PROFILE_SECTION_LIMIT)
                .toList();
    }

    private List<CommunityProfileReviewResponse> loadReviewHistory(Long userId) {
        return marketReviewRepository
                .findByReviewerIdAndVoteResultIsNullOrderByCreatedAtDesc(
                        userId,
                        PageRequest.of(0, PROFILE_SECTION_LIMIT))
                .stream()
                .map(this::toReviewResponse)
                .toList();
    }

    private CommunityProfileSubjectResponse toSubjectResponse(UserTopSubjectProjection item) {
        return CommunityProfileSubjectResponse.builder()
                .subjectId(item.getSubjectId())
                .subjectCode(item.getSubjectCode())
                .subjectName(item.getSubjectName())
                .score(Optional.ofNullable(item.getScore()).orElse(0L))
                .eventCount(Optional.ofNullable(item.getEventCount()).orElse(0L))
                .build();
    }

    private CommunityProfileContributionResponse toContribution(Document document) {
        return contributionBuilder(
                "DOCUMENT",
                document.getId(),
                document.getTitle(),
                document.getSubject(),
                document.getDownloadCount(),
                document.getCommunityReviewCount(),
                document.getCommunityRatingAvg(),
                document.getUpdatedAt());
    }

    private CommunityProfileContributionResponse toContribution(Quiz quiz) {
        return contributionBuilder(
                "QUIZ",
                quiz.getId(),
                quiz.getTitle(),
                quiz.getSubject(),
                quiz.getDownloadCount(),
                quiz.getCommunityReviewCount(),
                quiz.getCommunityRatingAvg(),
                quiz.getUpdatedAt());
    }

    private CommunityProfileContributionResponse toContribution(FlashcardDeck deck) {
        return contributionBuilder(
                "FLASHCARD_DECK",
                deck.getId(),
                deck.getTitle(),
                deck.getSubject(),
                deck.getDownloadCount(),
                deck.getCommunityReviewCount(),
                deck.getCommunityRatingAvg(),
                deck.getUpdatedAt());
    }

    private CommunityProfileContributionResponse contributionBuilder(
            String targetType,
            Long targetId,
            String title,
            Subject subject,
            Integer downloadCount,
            Integer communityReviewCount,
            BigDecimal communityRatingAvg,
            LocalDateTime approvedAt) {
        return CommunityProfileContributionResponse.builder()
                .targetType(targetType)
                .targetId(targetId)
                .title(title)
                .subjectId(subject != null ? subject.getId() : null)
                .subjectCode(subject != null ? subject.getCode() : null)
                .downloadCount(Optional.ofNullable(downloadCount).orElse(0))
                .communityReviewCount(Optional.ofNullable(communityReviewCount).orElse(0))
                .communityRatingAvg(communityRatingAvg != null ? communityRatingAvg : BigDecimal.ZERO)
                .approvedAt(approvedAt)
                .build();
    }

    private CommunityProfileReviewResponse toReviewResponse(MarketReview review) {
        ReviewTarget target = resolveReviewTarget(review);
        return CommunityProfileReviewResponse.builder()
                .id(review.getId())
                .targetType(target.targetType())
                .targetId(target.targetId())
                .targetTitle(target.title())
                .rating(review.getRating())
                .content(review.getReviewNote())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private ReviewTarget resolveReviewTarget(MarketReview review) {
        if (review.getDocument() != null) {
            return new ReviewTarget("DOCUMENT", review.getDocument().getId(), review.getDocument().getTitle());
        }
        if (review.getQuiz() != null) {
            return new ReviewTarget("QUIZ", review.getQuiz().getId(), review.getQuiz().getTitle());
        }
        if (review.getFlashcardDeck() != null) {
            return new ReviewTarget(
                    "FLASHCARD_DECK",
                    review.getFlashcardDeck().getId(),
                    review.getFlashcardDeck().getTitle());
        }
        return new ReviewTarget("UNKNOWN", null, null);
    }

    private record ReviewTarget(String targetType, Long targetId, String title) {
    }
}
