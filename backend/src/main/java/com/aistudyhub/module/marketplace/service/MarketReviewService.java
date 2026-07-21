package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.module.community.service.RewardBadgeService;
import com.aistudyhub.module.marketplace.dto.*;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.reputation.service.ReputationService;
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
 * Service handling marketplace review actions: vote queue, auto-approve, admin
 * override.
 * Owner: BE3 (Task BE-030, BE-046)
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
    private final NotificationService notificationService;
    private final MarketplaceSubmissionService marketplaceSubmissionService;
    private final MarketplaceSubmissionRepository marketplaceSubmissionRepository;
    private final ReviewPolicyService reviewPolicyService;
    private final RewardBadgeService rewardBadgeService;
    private final ReputationService reputationService;

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/reviewer/marketplace/pending — Pending Queue
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Get the list of resources pending review.
     * Admin/Global Reviewer sees all; Scoped Reviewer sees only their subjects.
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
            if (!isAdmin) predicates.add(cb.notEqual(root.get("user").get("id"), currentUser.getId()));

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
                        cb.like(cb.lower(root.get("description")), pattern)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Document> docs = documentRepository.findAll(docSpec);

        // 2. Query pending Quizzes
        Specification<Quiz> quizSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.PENDING));
            if (!isAdmin) predicates.add(cb.notEqual(root.get("creator").get("id"), currentUser.getId()));

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
                        cb.like(cb.lower(root.get("description")), pattern)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<Quiz> quizzes = quizRepository.findAll(quizSpec);

        // 3. Query pending FlashcardDecks
        Specification<FlashcardDeck> deckSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.PENDING));
            if (!isAdmin) predicates.add(cb.notEqual(root.get("user").get("id"), currentUser.getId()));

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
            QueuePolicy queuePolicy = resolveQueuePolicy("DOCUMENT", doc.getId(), doc.getSubject().getId(), doc.getUser().getId());
            items.add(MarketPendingItemResponse.builder()
                    .targetType("DOCUMENT")
                    .targetId(doc.getId())
                    .title(doc.getTitle())
                    .fileUrl(doc.getFileUrl())
                    .fileType(doc.getFileType())
                    .submittedAt(marketplaceSubmissionRepository
                            .findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(
                                    "DOCUMENT", doc.getId(), MarketStatus.PENDING)
                            .map(MarketplaceSubmission::getSubmittedAt)
                            .orElse(doc.getUpdatedAt()))
                    .subjectId(doc.getSubject().getId()).ownerId(doc.getUser().getId())
                    .adminRequired(queuePolicy.adminRequired()).policyMode(queuePolicy.mode())
                    .requiredVotes(queuePolicy.requiredVotes())
                    .build());
        }
        for (Quiz quiz : quizzes) {
            QueuePolicy queuePolicy = resolveQueuePolicy("QUIZ", quiz.getId(), quiz.getSubject().getId(), quiz.getCreator().getId());
            items.add(MarketPendingItemResponse.builder()
                    .targetType("QUIZ")
                    .targetId(quiz.getId())
                    .title(quiz.getTitle())
                    .submittedAt(marketplaceSubmissionRepository
                            .findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(
                                    "QUIZ", quiz.getId(), MarketStatus.PENDING)
                            .map(MarketplaceSubmission::getSubmittedAt)
                            .orElse(quiz.getUpdatedAt()))
                    .subjectId(quiz.getSubject().getId()).ownerId(quiz.getCreator().getId())
                    .adminRequired(queuePolicy.adminRequired()).policyMode(queuePolicy.mode())
                    .requiredVotes(queuePolicy.requiredVotes())
                    .build());
        }
        for (FlashcardDeck deck : decks) {
            QueuePolicy queuePolicy = resolveQueuePolicy("FLASHCARD_DECK", deck.getId(), deck.getSubject().getId(), deck.getUser().getId());
            items.add(MarketPendingItemResponse.builder()
                    .targetType("FLASHCARD_DECK")
                    .targetId(deck.getId())
                    .title(deck.getTitle())
                    .submittedAt(marketplaceSubmissionRepository
                            .findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(
                                    "FLASHCARD_DECK", deck.getId(), MarketStatus.PENDING)
                            .map(MarketplaceSubmission::getSubmittedAt)
                            .orElse(deck.getUpdatedAt()))
                    .subjectId(deck.getSubject().getId()).ownerId(deck.getUser().getId())
                    .adminRequired(queuePolicy.adminRequired()).policyMode(queuePolicy.mode())
                    .requiredVotes(queuePolicy.requiredVotes())
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

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/reviewer/marketplace/{targetType}/{targetId} — Item Detail
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Get detail of a pending marketplace item for reviewer preview before voting.
     */
    @Transactional(readOnly = true)
    public MarketplaceItemResponse getItemDetail(String targetType, Long targetId) {
        User currentUser = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> {
                communityPermissionService.assertReviewerPermissionForDocument(currentUser.getId(), targetId);
                Document doc = documentRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                yield toItemResponse(doc);
            }
            case "QUIZ" -> {
                communityPermissionService.assertReviewerPermissionForQuiz(currentUser.getId(), targetId);
                Quiz quiz = quizRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                yield toItemResponse(quiz);
            }
            case "FLASHCARD_DECK" -> {
                communityPermissionService.assertReviewerPermissionForFlashcardDeck(currentUser.getId(), targetId);
                FlashcardDeck deck = flashcardDeckRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                yield toItemResponse(deck);
            }
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/reviewer/marketplace/{targetType}/{targetId}/vote — Cast Vote
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Reviewer casts a vote (APPROVED/REJECTED) for a pending marketplace item.
     * Does NOT directly approve/reject — only accumulates votes.
     * Auto-approves/rejects when reviewCount >= minReviews threshold.
     */
    @Transactional
    public MarketReviewResponse vote(String targetType, Long targetId, MarketReviewRequest request) {
        String vote = normalizeLegacyVoteResult(request);
        request.setVoteResult(vote);

        User currentUser = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> voteForDocument(currentUser, targetId, request);
            case "QUIZ" -> voteForQuiz(currentUser, targetId, request);
            case "FLASHCARD_DECK" -> voteForFlashcardDeck(currentUser, targetId, request);
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PATCH /api/admin/marketplace/{targetType}/{targetId}/approve — Admin Override
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Admin overrides the vote queue and directly approves a marketplace item.
     */
    @Transactional
    public MarketReviewResponse adminApprove(String targetType, Long targetId, String reviewNote) {
        User admin = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> adminApproveDocument(admin, targetId, reviewNote);
            case "QUIZ" -> adminApproveQuiz(admin, targetId, reviewNote);
            case "FLASHCARD_DECK" -> adminApproveFlashcardDeck(admin, targetId, reviewNote);
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PATCH /api/admin/marketplace/{targetType}/{targetId}/reject — Admin Override
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Admin overrides the vote queue and directly rejects a marketplace item.
     */
    @Transactional
    public MarketReviewResponse adminReject(String targetType, Long targetId, String reviewNote) {
        User admin = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> adminRejectDocument(admin, targetId, reviewNote);
            case "QUIZ" -> adminRejectQuiz(admin, targetId, reviewNote);
            case "FLASHCARD_DECK" -> adminRejectFlashcardDeck(admin, targetId, reviewNote);
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private — Vote Logic for Each Entity Type
    // ══════════════════════════════════════════════════════════════════════════

    private MarketReviewResponse voteForDocument(User reviewer, Long documentId, MarketReviewRequest request) {
        communityPermissionService.assertReviewerPermissionForDocument(reviewer.getId(), documentId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (document.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Document is not pending review");
        }

        assertNotOwner(reviewer, document.getUser());
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "DOCUMENT", documentId, document.getSubject(), document.getUser());

        // Check duplicate vote
        if (marketReviewRepository.existsBySubmissionIdAndReviewerId(submission.getId(), reviewer.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        // Save vote (do NOT set marketStatus yet)
        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .submission(submission)
                .document(document)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        // Update statistics
        long totalReviews = marketReviewRepository.countBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        long approvedReviews = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        document.setReviewCount((int) totalReviews);
        document.setAcceptPercentage(acceptPercentage);

        // Check auto-approve/reject threshold
        ReviewDecision decision = evaluateSubmission(submission, reviewer, () -> {
            document.setMarketStatus(MarketStatus.APPROVED);
            document.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(document.getUser().getId(), document.getTitle(), true);
        }, () -> {
            document.setMarketStatus(MarketStatus.REJECTED);
            document.setVisibility(Visibility.PRIVATE);
            notifyAuthor(document.getUser().getId(), document.getTitle(), false);
        });

        documentRepository.save(document);

        log.info("Document id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                documentId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);
        rewardBadgeService.awardReviewerBadges(reviewer);
        rewardReviewerVote(reviewer, document.getSubject() != null ? document.getSubject().getId() : null,
                "DOCUMENT", documentId, review.getId());
        if (decision.reached()) {
            rewardMarketplaceDecision(submission, "DOCUMENT", documentId, submission.getStatus(), null);
        }

        return toReviewResponse(review, "DOCUMENT", documentId, submission, decision);
    }

    private MarketReviewResponse voteForQuiz(User reviewer, Long quizId, MarketReviewRequest request) {
        communityPermissionService.assertReviewerPermissionForQuiz(reviewer.getId(), quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        if (quiz.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Quiz is not pending review");
        }

        assertNotOwner(reviewer, quiz.getCreator());
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "QUIZ", quizId, quiz.getSubject(), quiz.getCreator());

        if (marketReviewRepository.existsBySubmissionIdAndReviewerId(submission.getId(), reviewer.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .submission(submission)
                .quiz(quiz)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        long totalReviews = marketReviewRepository.countBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        long approvedReviews = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        quiz.setReviewCount((int) totalReviews);
        quiz.setAcceptPercentage(acceptPercentage);

        ReviewDecision decision = evaluateSubmission(submission, reviewer, () -> {
            quiz.setMarketStatus(MarketStatus.APPROVED);
            quiz.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), true);
        }, () -> {
            quiz.setMarketStatus(MarketStatus.REJECTED);
            quiz.setVisibility(Visibility.PRIVATE);
            notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), false);
        });

        quizRepository.save(quiz);

        log.info("Quiz id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                quizId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);
        rewardBadgeService.awardReviewerBadges(reviewer);
        rewardReviewerVote(reviewer, quiz.getSubject() != null ? quiz.getSubject().getId() : null,
                "QUIZ", quizId, review.getId());
        if (decision.reached()) {
            rewardMarketplaceDecision(submission, "QUIZ", quizId, submission.getStatus(), null);
        }

        return toReviewResponse(review, "QUIZ", quizId, submission, decision);
    }

    private MarketReviewResponse voteForFlashcardDeck(User reviewer, Long deckId, MarketReviewRequest request) {
        communityPermissionService.assertReviewerPermissionForFlashcardDeck(reviewer.getId(), deckId);

        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        if (deck.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flashcard deck is not pending review");
        }

        assertNotOwner(reviewer, deck.getUser());
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "FLASHCARD_DECK", deckId, deck.getSubject(), deck.getUser());

        if (marketReviewRepository.existsBySubmissionIdAndReviewerId(submission.getId(), reviewer.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .submission(submission)
                .flashcardDeck(deck)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        long totalReviews = marketReviewRepository.countBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        long approvedReviews = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        deck.setReviewCount((int) totalReviews);
        deck.setAcceptPercentage(acceptPercentage);

        ReviewDecision decision = evaluateSubmission(submission, reviewer, () -> {
            deck.setMarketStatus(MarketStatus.APPROVED);
            deck.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(deck.getUser().getId(), deck.getTitle(), true);
        }, () -> {
            deck.setMarketStatus(MarketStatus.REJECTED);
            deck.setVisibility(Visibility.PRIVATE);
            notifyAuthor(deck.getUser().getId(), deck.getTitle(), false);
        });

        flashcardDeckRepository.save(deck);

        log.info("FlashcardDeck id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                deckId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);
        rewardBadgeService.awardReviewerBadges(reviewer);
        rewardReviewerVote(reviewer, deck.getSubject() != null ? deck.getSubject().getId() : null,
                "FLASHCARD_DECK", deckId, review.getId());
        if (decision.reached()) {
            rewardMarketplaceDecision(submission, "FLASHCARD_DECK", deckId, submission.getStatus(), null);
        }

        return toReviewResponse(review, "FLASHCARD_DECK", deckId, submission, decision);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private — Admin Override Logic
    // ══════════════════════════════════════════════════════════════════════════

    private MarketReviewResponse adminApproveDocument(User admin, Long documentId, String reviewNote) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        assertPendingReview(document.getMarketStatus(), "Document");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "DOCUMENT", documentId, document.getSubject(), document.getUser());
        document.setMarketStatus(MarketStatus.APPROVED);
        document.setVisibility(Visibility.MARKETPLACE);
        documentRepository.save(document);

        MarketReview review = saveAdminReview(admin, "APPROVED", normalizeAdminNote(reviewNote, "Approved by admin"));
        review.setSubmission(submission);
        review.setDocument(document);
        review = marketReviewRepository.save(review);

        notifyAuthor(document.getUser().getId(), document.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                "APPROVED", review.getId(), document.getReviewCount(),
                document.getAcceptPercentage());

        log.info("Document id={} admin-approved by admin id={}", documentId, admin.getId());
        return completeAdminDecision(review, "DOCUMENT", documentId, submission, admin, MarketStatus.APPROVED);
    }

    private MarketReviewResponse adminApproveQuiz(User admin, Long quizId, String reviewNote) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        assertPendingReview(quiz.getMarketStatus(), "Quiz");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "QUIZ", quizId, quiz.getSubject(), quiz.getCreator());
        quiz.setMarketStatus(MarketStatus.APPROVED);
        quiz.setVisibility(Visibility.MARKETPLACE);
        quizRepository.save(quiz);

        MarketReview review = saveAdminReview(admin, "APPROVED", normalizeAdminNote(reviewNote, "Approved by admin"));
        review.setSubmission(submission);
        review.setQuiz(quiz);
        review = marketReviewRepository.save(review);

        notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                "APPROVED", review.getId(), quiz.getReviewCount(),
                quiz.getAcceptPercentage());

        log.info("Quiz id={} admin-approved by admin id={}", quizId, admin.getId());
        return completeAdminDecision(review, "QUIZ", quizId, submission, admin, MarketStatus.APPROVED);
    }

    private MarketReviewResponse adminApproveFlashcardDeck(User admin, Long deckId, String reviewNote) {
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        assertPendingReview(deck.getMarketStatus(), "Flashcard deck");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "FLASHCARD_DECK", deckId, deck.getSubject(), deck.getUser());
        deck.setMarketStatus(MarketStatus.APPROVED);
        deck.setVisibility(Visibility.MARKETPLACE);
        flashcardDeckRepository.save(deck);

        MarketReview review = saveAdminReview(admin, "APPROVED", normalizeAdminNote(reviewNote, "Approved by admin"));
        review.setSubmission(submission);
        review.setFlashcardDeck(deck);
        review = marketReviewRepository.save(review);

        notifyAuthor(deck.getUser().getId(), deck.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                "APPROVED", review.getId(), deck.getReviewCount(),
                deck.getAcceptPercentage());

        log.info("FlashcardDeck id={} admin-approved by admin id={}", deckId, admin.getId());
        return completeAdminDecision(review, "FLASHCARD_DECK", deckId, submission, admin, MarketStatus.APPROVED);
    }

    private MarketReviewResponse adminRejectDocument(User admin, Long documentId, String reviewNote) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        assertPendingReview(document.getMarketStatus(), "Document");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "DOCUMENT", documentId, document.getSubject(), document.getUser());
        document.setMarketStatus(MarketStatus.REJECTED);
        document.setVisibility(Visibility.PRIVATE);
        documentRepository.save(document);

        MarketReview review = saveAdminReview(admin, "REJECTED", normalizeAdminNote(reviewNote, "Rejected by admin"));
        review.setSubmission(submission);
        review.setDocument(document);
        review = marketReviewRepository.save(review);

        notifyAuthor(document.getUser().getId(), document.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                "REJECTED", review.getId(), document.getReviewCount(),
                document.getAcceptPercentage());

        log.info("Document id={} admin-rejected by admin id={}", documentId, admin.getId());
        return completeAdminDecision(review, "DOCUMENT", documentId, submission, admin, MarketStatus.REJECTED);
    }

    private MarketReviewResponse adminRejectQuiz(User admin, Long quizId, String reviewNote) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        assertPendingReview(quiz.getMarketStatus(), "Quiz");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "QUIZ", quizId, quiz.getSubject(), quiz.getCreator());
        quiz.setMarketStatus(MarketStatus.REJECTED);
        quiz.setVisibility(Visibility.PRIVATE);
        quizRepository.save(quiz);

        MarketReview review = saveAdminReview(admin, "REJECTED", normalizeAdminNote(reviewNote, "Rejected by admin"));
        review.setSubmission(submission);
        review.setQuiz(quiz);
        review = marketReviewRepository.save(review);

        notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                "REJECTED", review.getId(), quiz.getReviewCount(),
                quiz.getAcceptPercentage());

        log.info("Quiz id={} admin-rejected by admin id={}", quizId, admin.getId());
        return completeAdminDecision(review, "QUIZ", quizId, submission, admin, MarketStatus.REJECTED);
    }

    private MarketReviewResponse adminRejectFlashcardDeck(User admin, Long deckId, String reviewNote) {
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        assertPendingReview(deck.getMarketStatus(), "Flashcard deck");
        MarketplaceSubmission submission = marketplaceSubmissionService.getOrCreateLegacyPending(
                "FLASHCARD_DECK", deckId, deck.getSubject(), deck.getUser());
        deck.setMarketStatus(MarketStatus.REJECTED);
        deck.setVisibility(Visibility.PRIVATE);
        flashcardDeckRepository.save(deck);

        MarketReview review = saveAdminReview(admin, "REJECTED", normalizeAdminNote(reviewNote, "Rejected by admin"));
        review.setSubmission(submission);
        review.setFlashcardDeck(deck);
        review = marketReviewRepository.save(review);

        notifyAuthor(deck.getUser().getId(), deck.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                "REJECTED", review.getId(), deck.getReviewCount(),
                deck.getAcceptPercentage());

        log.info("FlashcardDeck id={} admin-rejected by admin id={}", deckId, admin.getId());
        return completeAdminDecision(review, "FLASHCARD_DECK", deckId, submission, admin, MarketStatus.REJECTED);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private — Helpers
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Normalize voteResult for both legacy review endpoints and the BE-046 vote flow.
     */
    private String normalizeLegacyVoteResult(MarketReviewRequest request) {
        if (request == null || request.getVoteResult() == null || request.getVoteResult().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "voteResult is required");
        }

        String normalized = request.getVoteResult().trim().toUpperCase();
        if (!"APPROVED".equals(normalized) && !"REJECTED".equals(normalized)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid voteResult. Must be APPROVED or REJECTED");
        }
        return normalized;
    }

    private void assertPendingReview(MarketStatus marketStatus, String contentType) {
        if (marketStatus != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, contentType + " is not pending review");
        }
    }

    private void assertNotOwner(User reviewer, User owner) {
        if (reviewer.getId().equals(owner.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Content owners cannot review their own marketplace submission");
        }
    }

    private ReviewDecision evaluateSubmission(MarketplaceSubmission original,
            User decisionActor,
            Runnable onApprove,
            Runnable onReject) {
        MarketplaceSubmission submission = marketplaceSubmissionRepository.findByIdForUpdate(original.getId())
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Submission not found"));
        if (submission.getStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Marketplace submission has already been decided");
        }

        long total = marketReviewRepository.countBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        long approved = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "APPROVED");
        long rejected = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "REJECTED");
        BigDecimal percentage = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf((double) approved / total * 100).setScale(2, RoundingMode.HALF_UP);
        boolean reached = total >= submission.getRequiredVotesSnapshot();

        if (reached) {
            if (percentage.compareTo(BigDecimal.valueOf(submission.getApprovalPercentageSnapshot())) >= 0) {
                submission.setStatus(MarketStatus.APPROVED);
                onApprove.run();
            } else {
                submission.setStatus(MarketStatus.REJECTED);
                onReject.run();
            }
            submission.setDecidedAt(LocalDateTime.now());
            submission.setDecidedBy(decisionActor);
            marketplaceSubmissionRepository.save(submission);
        }
        original.setStatus(submission.getStatus());
        original.setDecidedAt(submission.getDecidedAt());
        original.setDecidedBy(submission.getDecidedBy());
        return new ReviewDecision(total, approved, rejected, percentage, reached);
    }

    private MarketReviewResponse toReviewResponse(MarketReview review, String type, Long targetId,
            MarketplaceSubmission submission, ReviewDecision decision) {
        return MarketReviewResponse.builder()
                .id(review.getId()).reviewerId(review.getReviewer().getId()).targetType(type).targetId(targetId)
                .voteResult(review.getVoteResult()).reviewNote(review.getReviewNote()).createdAt(review.getCreatedAt())
                .submissionId(submission.getId()).submissionStatus(submission.getStatus().name())
                .approvedVotes(decision.approved()).rejectedVotes(decision.rejected()).totalVotes(decision.total())
                .requiredVotes(submission.getRequiredVotesSnapshot())
                .approvalPercentageRequired(submission.getApprovalPercentageSnapshot())
                .decisionReached(decision.reached()).build();
    }

    private MarketReviewResponse completeAdminDecision(MarketReview review, String type, Long targetId,
            MarketplaceSubmission submission, User admin, MarketStatus status) {
        MarketplaceSubmission locked = marketplaceSubmissionRepository.findByIdForUpdate(submission.getId())
                .orElseThrow(() -> new AppException(ErrorCode.VALIDATION_ERROR, "Submission not found"));
        locked.setStatus(status);
        locked.setDecidedAt(LocalDateTime.now());
        locked.setDecidedBy(admin);
        marketplaceSubmissionRepository.save(locked);
        submission.setStatus(status);
        long total = marketReviewRepository.countBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        long approved = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "APPROVED");
        long rejected = marketReviewRepository.countBySubmissionIdAndVoteResult(submission.getId(), "REJECTED");
        rewardMarketplaceDecision(locked, type, targetId, status, admin.getId());
        return toReviewResponse(review, type, targetId, submission,
                new ReviewDecision(total, approved, rejected, BigDecimal.ZERO, true));
    }

    private void rewardReviewerVote(User reviewer, Long subjectId, String targetType, Long targetId, Long reviewId) {
        if (reviewer == null || reviewId == null) {
            return;
        }
        reputationService.applyConfiguredEvent(
                reviewer.getId(),
                subjectId,
                ReputationEventType.REVIEWER_MARKETPLACE_VOTE,
                targetType,
                targetId,
                "MARKET_REVIEW",
                reviewId,
                "Marketplace review vote",
                "REVIEWER_MARKETPLACE_VOTE:" + reviewId,
                reviewer.getId());
    }

    private void rewardMarketplaceDecision(
            MarketplaceSubmission submission,
            String targetType,
            Long targetId,
            MarketStatus finalStatus,
            Long excludeReviewerId) {

        ContentOwner owner = resolveContentOwner(targetType, targetId);
        if (owner == null) {
            return;
        }

        if (finalStatus == MarketStatus.APPROVED) {
            ReputationEventType approvedEvent = switch (targetType) {
                case "DOCUMENT" -> ReputationEventType.CONTENT_APPROVED_DOCUMENT;
                case "QUIZ" -> ReputationEventType.CONTENT_APPROVED_QUIZ;
                case "FLASHCARD_DECK" -> ReputationEventType.CONTENT_APPROVED_FLASHCARD_DECK;
                default -> null;
            };
            if (approvedEvent != null) {
                reputationService.applyConfiguredEvent(
                        owner.userId(),
                        owner.subjectId(),
                        approvedEvent,
                        targetType,
                        targetId,
                        "MARKETPLACE_SUBMISSION",
                        submission.getId(),
                        "Marketplace content approved",
                        "CONTENT_APPROVED:" + targetType + ":" + targetId + ":SUBMISSION:" + submission.getId(),
                        submission.getDecidedBy() != null ? submission.getDecidedBy().getId() : null);
            }
        }

        List<MarketReview> reviews = marketReviewRepository.findBySubmissionIdAndVoteResultIsNotNull(submission.getId());
        for (MarketReview review : reviews) {
            if (review.getReviewer() == null || review.getVoteResult() == null) {
                continue;
            }
            if (excludeReviewerId != null && excludeReviewerId.equals(review.getReviewer().getId())) {
                continue;
            }
            if (!review.getVoteResult().equalsIgnoreCase(finalStatus.name())) {
                continue;
            }
            reputationService.applyConfiguredEvent(
                    review.getReviewer().getId(),
                    owner.subjectId(),
                    ReputationEventType.REVIEWER_DECISION_ALIGNED,
                    targetType,
                    targetId,
                    "MARKET_REVIEW",
                    review.getId(),
                    "Reviewer vote aligned with final marketplace decision",
                    "REVIEWER_DECISION_ALIGNED:" + review.getId() + ":" + finalStatus.name(),
                    submission.getDecidedBy() != null ? submission.getDecidedBy().getId() : null);
        }
    }

    private ContentOwner resolveContentOwner(String targetType, Long targetId) {
        return switch (targetType) {
            case "DOCUMENT" -> documentRepository.findById(targetId)
                    .map(document -> new ContentOwner(
                            document.getUser() != null ? document.getUser().getId() : null,
                            document.getSubject() != null ? document.getSubject().getId() : null))
                    .orElse(null);
            case "QUIZ" -> quizRepository.findById(targetId)
                    .map(quiz -> new ContentOwner(
                            quiz.getCreator() != null ? quiz.getCreator().getId() : null,
                            quiz.getSubject() != null ? quiz.getSubject().getId() : null))
                    .orElse(null);
            case "FLASHCARD_DECK" -> flashcardDeckRepository.findById(targetId)
                    .map(deck -> new ContentOwner(
                            deck.getUser() != null ? deck.getUser().getId() : null,
                            deck.getSubject() != null ? deck.getSubject().getId() : null))
                    .orElse(null);
            default -> null;
        };
    }

    private QueuePolicy resolveQueuePolicy(String type, Long targetId, Long subjectId, Long ownerId) {
        MarketplaceSubmission submission = marketplaceSubmissionRepository
                .findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(type, targetId, MarketStatus.PENDING)
                .orElse(null);
        String mode;
        int requiredVotes;
        if (submission != null) {
            mode = submission.getPolicyModeSnapshot().name();
            requiredVotes = submission.getRequiredVotesSnapshot();
        } else {
            ReviewPolicyResponse policy = reviewPolicyService.resolve(subjectId);
            mode = policy.getMode().name();
            requiredVotes = policy.getRequiredVotes();
        }
        long eligible = communityRoleRepository.countEligibleSubjectReviewers(subjectId, ownerId,
                List.of(CommunityRoleType.REVIEWER, CommunityRoleType.MARKETPLACE_REVIEWER),
                CommunityRoleStatus.ACTIVE, LocalDateTime.now());
        return new QueuePolicy(mode, requiredVotes, eligible < requiredVotes);
    }

    private record ReviewDecision(long total, long approved, long rejected, BigDecimal percentage, boolean reached) {}
    private record QueuePolicy(String mode, int requiredVotes, boolean adminRequired) {}
    private record ContentOwner(Long userId, Long subjectId) {}

    /**
     * Parse and validate targetType from path variable.
     */
    private String parseTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "targetType is required. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        }
        String normalized = targetType.trim().toUpperCase();
        if (!normalized.equals("DOCUMENT") && !normalized.equals("QUIZ") && !normalized.equals("FLASHCARD_DECK")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        }
        return normalized;
    }

    /**
     * Send notification to content author when their marketplace item is
     * approved/rejected.
     */
    private void notifyAuthor(Long authorUserId, String contentTitle, boolean approved) {
        try {
            String title = approved
                    ? "Marketplace content approved"
                    : "Marketplace content rejected";
            String content = approved
                    ? "Your marketplace content \"" + contentTitle
                            + "\" has been approved and is now visible in the marketplace."
                    : "Your marketplace content \"" + contentTitle
                            + "\" has been rejected. Please review and resubmit.";
            notificationService.createNotification(authorUserId, title, content);
        } catch (Exception e) {
            log.warn("Failed to send notification to author userId={}: {}", authorUserId, e.getMessage());
        }
    }

    /**
     * Create a MarketReview for admin override actions.
     */
    private MarketReview saveAdminReview(User admin, String voteResult, String reviewNote) {
        return MarketReview.builder()
                .reviewer(admin)
                .voteResult(voteResult)
                .reviewNote(reviewNote)
                .build();
    }

    private String normalizeAdminNote(String note, String fallback) {
        return note == null || note.isBlank() ? fallback : note.trim();
    }

    // ── Mapping Helpers ─────────────────────────────────────────────────────

    private MarketplaceItemResponse toItemResponse(Document doc) {
        return MarketplaceItemResponse.builder()
                .targetType("DOCUMENT")
                .targetId(doc.getId())
                .title(doc.getTitle())
                .subjectId(doc.getSubject() != null ? doc.getSubject().getId() : null)
                .creatorId(doc.getUser() != null ? doc.getUser().getId() : null)
                .creatorName(doc.getUser() != null ? doc.getUser().getFullName() : null)
                .downloadCount(doc.getDownloadCount())
                .reviewCount(doc.getReviewCount())
                .acceptPercentage(doc.getAcceptPercentage())
                .communityReviewCount(doc.getCommunityReviewCount())
                .communityRatingAvg(doc.getCommunityRatingAvg())
                .marketStatus(doc.getMarketStatus())
                .visibility(doc.getVisibility())
                .fileUrl(doc.getFileUrl())
                .fileType(doc.getFileType())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private MarketplaceItemResponse toItemResponse(Quiz quiz) {
        return MarketplaceItemResponse.builder()
                .targetType("QUIZ")
                .targetId(quiz.getId())
                .title(quiz.getTitle())
                .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
                .creatorId(quiz.getCreator() != null ? quiz.getCreator().getId() : null)
                .creatorName(quiz.getCreator() != null ? quiz.getCreator().getFullName() : null)
                .downloadCount(quiz.getDownloadCount())
                .reviewCount(quiz.getReviewCount())
                .acceptPercentage(quiz.getAcceptPercentage())
                .communityReviewCount(quiz.getCommunityReviewCount())
                .communityRatingAvg(quiz.getCommunityRatingAvg())
                .marketStatus(quiz.getMarketStatus())
                .visibility(quiz.getVisibility())
                .build();
    }

    private MarketplaceItemResponse toItemResponse(FlashcardDeck deck) {
        return MarketplaceItemResponse.builder()
                .targetType("FLASHCARD_DECK")
                .targetId(deck.getId())
                .title(deck.getTitle())
                .subjectId(deck.getSubject() != null ? deck.getSubject().getId() : null)
                .creatorId(deck.getUser() != null ? deck.getUser().getId() : null)
                .creatorName(deck.getUser() != null ? deck.getUser().getFullName() : null)
                .downloadCount(deck.getDownloadCount())
                .reviewCount(deck.getReviewCount())
                .acceptPercentage(deck.getAcceptPercentage())
                .communityReviewCount(deck.getCommunityReviewCount())
                .communityRatingAvg(deck.getCommunityRatingAvg())
                .marketStatus(deck.getMarketStatus())
                .visibility(deck.getVisibility())
                .build();
    }

    // ── Activity Log (preserved from BE-030) ────────────────────────────────

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
