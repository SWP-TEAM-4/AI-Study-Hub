package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.module.marketplace.dto.*;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Service handling all marketplace review actions.
 * Owner: BE3 (Task BE-030)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MarketReviewService {

    private final MarketReviewRepository marketReviewRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final UserService userService;
    private final CommunityPermissionService communityPermissionService;
    private final CommunityRoleRepository communityRoleRepository;
    private final ActivityLogService activityLogService;

    /**
     * Get the list of resources pending review.
     */
    @Transactional(readOnly = true)
    public PaginationResponse<MarketPendingItemResponse> getPendingQueue(MarketplaceQueryRequest request) {
        int page = (request.getPage() == null || request.getPage() < 0) ? 0 : request.getPage();
        int size = (request.getSize() == null || request.getSize() <= 0) ? 10 : request.getSize();

        User currentUser = userService.getCurrentUser();
        boolean isAdmin = communityPermissionService.isAdmin(currentUser);

        final boolean restrictBySubjects;
        final List<Long> allowedSubjectIds;

        if (isAdmin) {
            restrictBySubjects = false;
            allowedSubjectIds = List.of();
        } else {
            List<CommunityRole> activeRoles = communityRoleRepository.findCurrentRolesByUserId(
                    currentUser.getId(),
                    CommunityRoleStatus.ACTIVE,
                    LocalDateTime.now());

            boolean hasGlobalReviewer = activeRoles.stream()
                    .anyMatch(r -> (r.getRoleType() == CommunityRoleType.REVIEWER
                                    || r.getRoleType() == CommunityRoleType.MARKETPLACE_REVIEWER)
                            && (r.getScopeType() == CommunityScopeType.GLOBAL || r.getScopeType() == null));

            if (hasGlobalReviewer) {
                restrictBySubjects = false;
                allowedSubjectIds = List.of();
            } else {
                restrictBySubjects = true;
                allowedSubjectIds = activeRoles.stream()
                        .filter(r -> r.getRoleType() == CommunityRoleType.REVIEWER
                                || r.getRoleType() == CommunityRoleType.MARKETPLACE_REVIEWER)
                        .filter(r -> r.getScopeType() == CommunityScopeType.SUBJECT && r.getScopeId() != null)
                        .map(CommunityRole::getScopeId)
                        .toList();
            }
        }

        // 1. Query pending Documents
        Specification<Document> docSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.PENDING));

            if (restrictBySubjects) {
                if (allowedSubjectIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    if (request.getSubjectId() != null) {
                        if (allowedSubjectIds.contains(request.getSubjectId())) {
                            predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        predicates.add(root.get("subject").get("id").in(allowedSubjectIds));
                    }
                }
            } else {
                if (request.getSubjectId() != null) {
                    predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                }
            }

            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Document> docs = documentRepository.findAll(docSpec);

        // 2. Query pending Quizzes
        Specification<Quiz> quizSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.PENDING));

            if (restrictBySubjects) {
                if (allowedSubjectIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    if (request.getSubjectId() != null) {
                        if (allowedSubjectIds.contains(request.getSubjectId())) {
                            predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        predicates.add(root.get("subject").get("id").in(allowedSubjectIds));
                    }
                }
            } else {
                if (request.getSubjectId() != null) {
                    predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                }
            }

            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Quiz> quizzes = quizRepository.findAll(quizSpec);

        // 3. Query pending FlashcardDecks
        Specification<FlashcardDeck> deckSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.PENDING));

            if (restrictBySubjects) {
                if (allowedSubjectIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    if (request.getSubjectId() != null) {
                        if (allowedSubjectIds.contains(request.getSubjectId())) {
                            predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                        } else {
                            predicates.add(cb.disjunction());
                        }
                    } else {
                        predicates.add(root.get("subject").get("id").in(allowedSubjectIds));
                    }
                }
            } else {
                if (request.getSubjectId() != null) {
                    predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
                }
            }

            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<FlashcardDeck> decks = flashcardDeckRepository.findAll(deckSpec);

        // 4. Combine into a unified pending list
        List<MarketPendingItemResponse> items = new ArrayList<>();
        for (Document doc : docs) {
            items.add(MarketPendingItemResponse.builder()
                    .targetType("DOCUMENT")
                    .targetId(doc.getId())
                    .title(doc.getTitle())
                    .submittedAt(doc.getUpdatedAt())
                    .build());
        }
        for (Quiz quiz : quizzes) {
            items.add(MarketPendingItemResponse.builder()
                    .targetType("QUIZ")
                    .targetId(quiz.getId())
                    .title(quiz.getTitle())
                    .submittedAt(quiz.getUpdatedAt())
                    .build());
        }
        for (FlashcardDeck deck : decks) {
            items.add(MarketPendingItemResponse.builder()
                    .targetType("FLASHCARD_DECK")
                    .targetId(deck.getId())
                    .title(deck.getTitle())
                    .submittedAt(deck.getUpdatedAt())
                    .build());
        }

        // 5. Sort by newest (submittedAt descending)
        items.sort((a, b) -> {
            LocalDateTime ta = a.getSubmittedAt() != null ? a.getSubmittedAt() : LocalDateTime.MIN;
            LocalDateTime tb = b.getSubmittedAt() != null ? b.getSubmittedAt() : LocalDateTime.MIN;
            return tb.compareTo(ta);
        });

        // 6. Paginate manually
        int totalElements = items.size();
        int start = page * size;
        List<MarketPendingItemResponse> sliced = new ArrayList<>();
        if (start < totalElements) {
            int end = Math.min(start + size, totalElements);
            sliced = items.subList(start, end);
        }

        return PaginationResponse.of(sliced, page, size, totalElements);
    }

    /**
     * Review a pending document.
     */
    @Transactional
    public MarketReviewResponse reviewDocument(Long documentId, MarketReviewRequest request) {
        String vote = request.getVoteResult();
        if (vote == null || (!vote.equalsIgnoreCase("APPROVED") && !vote.equalsIgnoreCase("REJECTED"))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid voteResult. Must be APPROVED or REJECTED");
        }

        User currentUser = userService.getCurrentUser();
        communityPermissionService.assertReviewerPermissionForDocument(currentUser.getId(), documentId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (document.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Document is not pending review");
        }

        MarketStatus newStatus = MarketStatus.valueOf(request.getVoteResult().toUpperCase());
        document.setMarketStatus(newStatus);

        // If approved, verify the visibility is set to MARKETPLACE
        if (newStatus == MarketStatus.APPROVED) {
            document.setVisibility(com.aistudyhub.common.enums.Visibility.MARKETPLACE);
        }

        // Save review history
        MarketReview review = MarketReview.builder()
                .reviewer(currentUser)
                .document(document)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        // Update statistics
        long totalReviews = marketReviewRepository.countByDocumentId(documentId);
        long approvedReviews = marketReviewRepository.countByDocumentIdAndVoteResult(documentId, "APPROVED");
        BigDecimal acceptPercentage = BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                .setScale(2, RoundingMode.HALF_UP);

        document.setReviewCount((int) totalReviews);
        document.setAcceptPercentage(acceptPercentage);
        documentRepository.save(document);

        log.info("Document id={} reviewed successfully by reviewer id={} with result={}",
                documentId, currentUser.getId(), request.getVoteResult());
        logReviewAction(currentUser.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "DOCUMENT", documentId);
    }

    /**
     * Review a pending quiz.
     */
    @Transactional
    public MarketReviewResponse reviewQuiz(Long quizId, MarketReviewRequest request) {
        String vote = request.getVoteResult();
        if (vote == null || (!vote.equalsIgnoreCase("APPROVED") && !vote.equalsIgnoreCase("REJECTED"))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid voteResult. Must be APPROVED or REJECTED");
        }

        User currentUser = userService.getCurrentUser();
        communityPermissionService.assertReviewerPermissionForQuiz(currentUser.getId(), quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        if (quiz.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Quiz is not pending review");
        }

        MarketStatus newStatus = MarketStatus.valueOf(request.getVoteResult().toUpperCase());
        quiz.setMarketStatus(newStatus);

        if (newStatus == MarketStatus.APPROVED) {
            quiz.setVisibility(com.aistudyhub.common.enums.Visibility.MARKETPLACE);
        }

        // Save review history
        MarketReview review = MarketReview.builder()
                .reviewer(currentUser)
                .quiz(quiz)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        // Update statistics
        long totalReviews = marketReviewRepository.countByQuizId(quizId);
        long approvedReviews = marketReviewRepository.countByQuizIdAndVoteResult(quizId, "APPROVED");
        BigDecimal acceptPercentage = BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                .setScale(2, RoundingMode.HALF_UP);

        quiz.setReviewCount((int) totalReviews);
        quiz.setAcceptPercentage(acceptPercentage);
        quizRepository.save(quiz);

        log.info("Quiz id={} reviewed successfully by reviewer id={} with result={}",
                quizId, currentUser.getId(), request.getVoteResult());
        logReviewAction(currentUser.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "QUIZ", quizId);
    }

    /**
     * Review a pending flashcard deck.
     */
    @Transactional
    public MarketReviewResponse reviewFlashcardDeck(Long deckId, MarketReviewRequest request) {
        String vote = request.getVoteResult();
        if (vote == null || (!vote.equalsIgnoreCase("APPROVED") && !vote.equalsIgnoreCase("REJECTED"))) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid voteResult. Must be APPROVED or REJECTED");
        }

        User currentUser = userService.getCurrentUser();
        communityPermissionService.assertReviewerPermissionForFlashcardDeck(currentUser.getId(), deckId);

        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        if (deck.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flashcard deck is not pending review");
        }

        MarketStatus newStatus = MarketStatus.valueOf(request.getVoteResult().toUpperCase());
        deck.setMarketStatus(newStatus);

        if (newStatus == MarketStatus.APPROVED) {
            deck.setVisibility(com.aistudyhub.common.enums.Visibility.MARKETPLACE);
        }

        // Save review history
        MarketReview review = MarketReview.builder()
                .reviewer(currentUser)
                .flashcardDeck(deck)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        // Update statistics
        long totalReviews = marketReviewRepository.countByFlashcardDeckId(deckId);
        long approvedReviews = marketReviewRepository.countByFlashcardDeckIdAndVoteResult(deckId, "APPROVED");
        BigDecimal acceptPercentage = BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                .setScale(2, RoundingMode.HALF_UP);

        deck.setReviewCount((int) totalReviews);
        deck.setAcceptPercentage(acceptPercentage);
        flashcardDeckRepository.save(deck);

        log.info("Flashcard deck id={} reviewed successfully by reviewer id={} with result={}",
                deckId, currentUser.getId(), request.getVoteResult());
        logReviewAction(currentUser.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "FLASHCARD_DECK", deckId);
    }

    private void logReviewAction(Long actorUserId,
                                 ActivityTargetType targetType,
                                 Long targetId,
                                 String title,
                                 String subjectCode,
                                 String voteResult,
                                 Long reviewId,
                                 long totalReviews,
                                 BigDecimal acceptPercentage) {
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("voteResult", voteResult != null ? voteResult.toUpperCase() : null);
        metadata.put("reviewId", reviewId);
        metadata.put("reviewCount", totalReviews);
        metadata.put("acceptPercentage", acceptPercentage);
        activityLogService.log(
                actorUserId,
                ActivityActionType.REVIEW_CONTENT,
                targetType,
                targetId,
                metadata,
                title,
                subjectCode,
                voteResult);
    }
}
