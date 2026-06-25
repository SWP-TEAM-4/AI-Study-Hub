package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.module.marketplace.dto.*;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
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
    private final SystemConfigService systemConfigService;
    private final NotificationService notificationService;

    // ── Constants ────────────────────────────────────────────────────────────
    private static final int DEFAULT_MIN_REVIEWS = 3;
    private static final int DEFAULT_ACCEPT_PERCENTAGE = 70;

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
    public MarketReviewResponse adminApprove(String targetType, Long targetId) {
        User admin = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> adminApproveDocument(admin, targetId);
            case "QUIZ" -> adminApproveQuiz(admin, targetId);
            case "FLASHCARD_DECK" -> adminApproveFlashcardDeck(admin, targetId);
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
    public MarketReviewResponse adminReject(String targetType, Long targetId) {
        User admin = userService.getCurrentUser();
        String type = parseTargetType(targetType);

        return switch (type) {
            case "DOCUMENT" -> adminRejectDocument(admin, targetId);
            case "QUIZ" -> adminRejectQuiz(admin, targetId);
            case "FLASHCARD_DECK" -> adminRejectFlashcardDeck(admin, targetId);
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

        // Check duplicate vote
        if (marketReviewRepository.existsByReviewerIdAndDocumentIdAndVoteResultIsNotNull(
                reviewer.getId(), documentId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        // Save vote (do NOT set marketStatus yet)
        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .document(document)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        // Update statistics
        long totalReviews = marketReviewRepository.countByDocumentIdAndVoteResultIsNotNull(documentId);
        long approvedReviews = marketReviewRepository.countByDocumentIdAndVoteResult(documentId, "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        document.setReviewCount((int) totalReviews);
        document.setAcceptPercentage(acceptPercentage);

        // Check auto-approve/reject threshold
        checkAutoApproveReject(document.getMarketStatus(), totalReviews, acceptPercentage, () -> {
            document.setMarketStatus(MarketStatus.APPROVED);
            document.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(document.getUser().getId(), document.getTitle(), true);
        }, () -> {
            document.setMarketStatus(MarketStatus.REJECTED);
            notifyAuthor(document.getUser().getId(), document.getTitle(), false);
        });

        documentRepository.save(document);

        log.info("Document id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                documentId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "DOCUMENT", documentId);
    }

    private MarketReviewResponse voteForQuiz(User reviewer, Long quizId, MarketReviewRequest request) {
        communityPermissionService.assertReviewerPermissionForQuiz(reviewer.getId(), quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        if (quiz.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Quiz is not pending review");
        }

        if (marketReviewRepository.existsByReviewerIdAndQuizIdAndVoteResultIsNotNull(
                reviewer.getId(), quizId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .quiz(quiz)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        long totalReviews = marketReviewRepository.countByQuizIdAndVoteResultIsNotNull(quizId);
        long approvedReviews = marketReviewRepository.countByQuizIdAndVoteResult(quizId, "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        quiz.setReviewCount((int) totalReviews);
        quiz.setAcceptPercentage(acceptPercentage);

        checkAutoApproveReject(quiz.getMarketStatus(), totalReviews, acceptPercentage, () -> {
            quiz.setMarketStatus(MarketStatus.APPROVED);
            quiz.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), true);
        }, () -> {
            quiz.setMarketStatus(MarketStatus.REJECTED);
            notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), false);
        });

        quizRepository.save(quiz);

        log.info("Quiz id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                quizId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "QUIZ", quizId);
    }

    private MarketReviewResponse voteForFlashcardDeck(User reviewer, Long deckId, MarketReviewRequest request) {
        communityPermissionService.assertReviewerPermissionForFlashcardDeck(reviewer.getId(), deckId);

        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        if (deck.getMarketStatus() != MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flashcard deck is not pending review");
        }

        if (marketReviewRepository.existsByReviewerIdAndFlashcardDeckIdAndVoteResultIsNotNull(
                reviewer.getId(), deckId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "You have already voted for this item");
        }

        MarketReview review = MarketReview.builder()
                .reviewer(reviewer)
                .flashcardDeck(deck)
                .voteResult(request.getVoteResult().toUpperCase())
                .reviewNote(request.getReviewNote())
                .build();
        review = marketReviewRepository.save(review);

        long totalReviews = marketReviewRepository.countByFlashcardDeckIdAndVoteResultIsNotNull(deckId);
        long approvedReviews = marketReviewRepository.countByFlashcardDeckIdAndVoteResult(deckId, "APPROVED");
        BigDecimal acceptPercentage = totalReviews > 0
                ? BigDecimal.valueOf((double) approvedReviews / totalReviews * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        deck.setReviewCount((int) totalReviews);
        deck.setAcceptPercentage(acceptPercentage);

        checkAutoApproveReject(deck.getMarketStatus(), totalReviews, acceptPercentage, () -> {
            deck.setMarketStatus(MarketStatus.APPROVED);
            deck.setVisibility(Visibility.MARKETPLACE);
            notifyAuthor(deck.getUser().getId(), deck.getTitle(), true);
        }, () -> {
            deck.setMarketStatus(MarketStatus.REJECTED);
            notifyAuthor(deck.getUser().getId(), deck.getTitle(), false);
        });

        flashcardDeckRepository.save(deck);

        log.info("FlashcardDeck id={} voted by reviewer id={} result={} (reviewCount={}, acceptPct={})",
                deckId, reviewer.getId(), request.getVoteResult(), totalReviews, acceptPercentage);
        logReviewAction(reviewer.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                request.getVoteResult(), review.getId(), totalReviews, acceptPercentage);

        return MarketReviewResponse.fromEntity(review, "FLASHCARD_DECK", deckId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private — Admin Override Logic
    // ══════════════════════════════════════════════════════════════════════════

    private MarketReviewResponse adminApproveDocument(User admin, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        assertPendingReview(document.getMarketStatus(), "Document");
        document.setMarketStatus(MarketStatus.APPROVED);
        document.setVisibility(Visibility.MARKETPLACE);
        documentRepository.save(document);

        MarketReview review = saveAdminReview(admin, "APPROVED", "Approved by admin");
        review.setDocument(document);
        review = marketReviewRepository.save(review);

        notifyAuthor(document.getUser().getId(), document.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                "APPROVED", review.getId(), document.getReviewCount(),
                document.getAcceptPercentage());

        log.info("Document id={} admin-approved by admin id={}", documentId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "DOCUMENT", documentId);
    }

    private MarketReviewResponse adminApproveQuiz(User admin, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        assertPendingReview(quiz.getMarketStatus(), "Quiz");
        quiz.setMarketStatus(MarketStatus.APPROVED);
        quiz.setVisibility(Visibility.MARKETPLACE);
        quizRepository.save(quiz);

        MarketReview review = saveAdminReview(admin, "APPROVED", "Approved by admin");
        review.setQuiz(quiz);
        review = marketReviewRepository.save(review);

        notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                "APPROVED", review.getId(), quiz.getReviewCount(),
                quiz.getAcceptPercentage());

        log.info("Quiz id={} admin-approved by admin id={}", quizId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "QUIZ", quizId);
    }

    private MarketReviewResponse adminApproveFlashcardDeck(User admin, Long deckId) {
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        assertPendingReview(deck.getMarketStatus(), "Flashcard deck");
        deck.setMarketStatus(MarketStatus.APPROVED);
        deck.setVisibility(Visibility.MARKETPLACE);
        flashcardDeckRepository.save(deck);

        MarketReview review = saveAdminReview(admin, "APPROVED", "Approved by admin");
        review.setFlashcardDeck(deck);
        review = marketReviewRepository.save(review);

        notifyAuthor(deck.getUser().getId(), deck.getTitle(), true);
        logReviewAction(admin.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                "APPROVED", review.getId(), deck.getReviewCount(),
                deck.getAcceptPercentage());

        log.info("FlashcardDeck id={} admin-approved by admin id={}", deckId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "FLASHCARD_DECK", deckId);
    }

    private MarketReviewResponse adminRejectDocument(User admin, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        assertPendingReview(document.getMarketStatus(), "Document");
        document.setMarketStatus(MarketStatus.REJECTED);
        documentRepository.save(document);

        MarketReview review = saveAdminReview(admin, "REJECTED", "Rejected by admin");
        review.setDocument(document);
        review = marketReviewRepository.save(review);

        notifyAuthor(document.getUser().getId(), document.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.DOCUMENT, documentId, document.getTitle(),
                document.getSubject() != null ? document.getSubject().getCode() : null,
                "REJECTED", review.getId(), document.getReviewCount(),
                document.getAcceptPercentage());

        log.info("Document id={} admin-rejected by admin id={}", documentId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "DOCUMENT", documentId);
    }

    private MarketReviewResponse adminRejectQuiz(User admin, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        assertPendingReview(quiz.getMarketStatus(), "Quiz");
        quiz.setMarketStatus(MarketStatus.REJECTED);
        quizRepository.save(quiz);

        MarketReview review = saveAdminReview(admin, "REJECTED", "Rejected by admin");
        review.setQuiz(quiz);
        review = marketReviewRepository.save(review);

        notifyAuthor(quiz.getCreator().getId(), quiz.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.QUIZ, quizId, quiz.getTitle(),
                quiz.getSubject() != null ? quiz.getSubject().getCode() : null,
                "REJECTED", review.getId(), quiz.getReviewCount(),
                quiz.getAcceptPercentage());

        log.info("Quiz id={} admin-rejected by admin id={}", quizId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "QUIZ", quizId);
    }

    private MarketReviewResponse adminRejectFlashcardDeck(User admin, Long deckId) {
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        assertPendingReview(deck.getMarketStatus(), "Flashcard deck");
        deck.setMarketStatus(MarketStatus.REJECTED);
        flashcardDeckRepository.save(deck);

        MarketReview review = saveAdminReview(admin, "REJECTED", "Rejected by admin");
        review.setFlashcardDeck(deck);
        review = marketReviewRepository.save(review);

        notifyAuthor(deck.getUser().getId(), deck.getTitle(), false);
        logReviewAction(admin.getId(), ActivityTargetType.FLASHCARD_DECK, deckId, deck.getTitle(),
                deck.getSubject() != null ? deck.getSubject().getCode() : null,
                "REJECTED", review.getId(), deck.getReviewCount(),
                deck.getAcceptPercentage());

        log.info("FlashcardDeck id={} admin-rejected by admin id={}", deckId, admin.getId());
        return MarketReviewResponse.fromEntity(review, "FLASHCARD_DECK", deckId);
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
     * Check auto-approve or auto-reject based on system config thresholds.
     * Only triggers when marketStatus is still PENDING and reviewCount >=
     * minReviews.
     */
    private void checkAutoApproveReject(MarketStatus currentStatus,
            long totalReviews,
            BigDecimal acceptPercentage,
            Runnable onApprove,
            Runnable onReject) {
        if (currentStatus != MarketStatus.PENDING) {
            return;
        }

        int minReviews = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.MARKETPLACE_AUTO_APPROVE_MIN_REVIEWS, DEFAULT_MIN_REVIEWS);
        int acceptPctThreshold = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.MARKETPLACE_AUTO_APPROVE_ACCEPT_PERCENTAGE, DEFAULT_ACCEPT_PERCENTAGE);

        if (totalReviews >= minReviews) {
            if (acceptPercentage.compareTo(BigDecimal.valueOf(acceptPctThreshold)) >= 0) {
                log.info("Auto-approve triggered: reviewCount={}, acceptPct={}, threshold={}",
                        totalReviews, acceptPercentage, acceptPctThreshold);
                onApprove.run();
            } else {
                log.info("Auto-reject triggered: reviewCount={}, acceptPct={}, threshold={}",
                        totalReviews, acceptPercentage, acceptPctThreshold);
                onReject.run();
            }
        }
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

    // ── Mapping Helpers ─────────────────────────────────────────────────────

    private MarketplaceItemResponse toItemResponse(Document doc) {
        return MarketplaceItemResponse.builder()
                .targetType("DOCUMENT")
                .targetId(doc.getId())
                .title(doc.getTitle())
                .subjectId(doc.getSubject() != null ? doc.getSubject().getId() : null)
                .creatorName(doc.getUser() != null ? doc.getUser().getFullName() : null)
                .downloadCount(doc.getDownloadCount())
                .reviewCount(doc.getReviewCount())
                .acceptPercentage(doc.getAcceptPercentage())
                .marketStatus(doc.getMarketStatus())
                .visibility(doc.getVisibility())
                .build();
    }

    private MarketplaceItemResponse toItemResponse(Quiz quiz) {
        return MarketplaceItemResponse.builder()
                .targetType("QUIZ")
                .targetId(quiz.getId())
                .title(quiz.getTitle())
                .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
                .creatorName(quiz.getCreator() != null ? quiz.getCreator().getFullName() : null)
                .downloadCount(quiz.getDownloadCount())
                .reviewCount(quiz.getReviewCount())
                .acceptPercentage(quiz.getAcceptPercentage())
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
                .creatorName(deck.getUser() != null ? deck.getUser().getFullName() : null)
                .downloadCount(deck.getDownloadCount())
                .reviewCount(deck.getReviewCount())
                .acceptPercentage(deck.getAcceptPercentage())
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
