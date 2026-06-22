package com.aistudyhub.module.community.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.community.dto.CommunityReviewRequest;
import com.aistudyhub.module.community.dto.CommunityReviewResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý nghiệp vụ đánh giá/bình luận cộng đồng (Community Review).
 * <p>
 * Sử dụng chung bảng market_reviews với Marketplace Review,
 * phân biệt bằng cột vote_result: NULL = community review, NOT NULL = marketplace review.
 * <p>
 * Owner: BE3 (Task BE-042)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityReviewService {

    private final MarketReviewRepository marketReviewRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final UserService userService;

    // ── 1. Tạo đánh giá cộng đồng ─────────────────────────────────────────────

    /**
     * Tạo một đánh giá cộng đồng mới cho tài nguyên (Document/Quiz/FlashcardDeck).
     * <p>
     * Quy tắc:
     * - Kiểm tra tài nguyên đích có tồn tại hay không.
     * - Mỗi user chỉ được đánh giá 1 tài nguyên tối đa 1 lần.
     * - Lưu vào bảng market_reviews với vote_result = null để phân biệt với marketplace review.
     *
     * @param request thông tin đánh giá từ FE
     * @return CommunityReviewResponse chứa thông tin đánh giá vừa tạo
     */
    @Transactional
    public CommunityReviewResponse createReview(CommunityReviewRequest request) {
        // Bước 1: Lấy user hiện tại từ Security Context
        User currentUser = userService.getCurrentUser();
        Long userId = currentUser.getId();

        // Bước 2: Xác định loại tài nguyên và validate
        String targetType = normalizeTargetType(request.getTargetType());
        Long targetId = request.getTargetId();

        // Bước 3: Kiểm tra tài nguyên tồn tại + kiểm tra trùng lặp + build entity
        MarketReview review = MarketReview.builder()
                .reviewer(currentUser)
                .rating(request.getRating())
                .reviewNote(request.getContent())
                // vote_result = null → community review
                .build();

        switch (targetType) {
            case "DOCUMENT" -> {
                // Kiểm tra document có tồn tại không
                Document document = documentRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                // Kiểm tra user đã đánh giá document này chưa
                marketReviewRepository.findByReviewerIdAndDocumentIdAndVoteResultIsNull(userId, targetId)
                        .ifPresent(existing -> {
                            throw new AppException(ErrorCode.DUPLICATE_REVIEW);
                        });
                review.setDocument(document);
            }
            case "QUIZ" -> {
                // Kiểm tra quiz có tồn tại không
                Quiz quiz = quizRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                // Kiểm tra user đã đánh giá quiz này chưa
                marketReviewRepository.findByReviewerIdAndQuizIdAndVoteResultIsNull(userId, targetId)
                        .ifPresent(existing -> {
                            throw new AppException(ErrorCode.DUPLICATE_REVIEW);
                        });
                review.setQuiz(quiz);
            }
            case "FLASHCARD_DECK" -> {
                // Kiểm tra flashcard deck có tồn tại không
                FlashcardDeck deck = flashcardDeckRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                // Kiểm tra user đã đánh giá flashcard deck này chưa
                marketReviewRepository.findByReviewerIdAndFlashcardDeckIdAndVoteResultIsNull(userId, targetId)
                        .ifPresent(existing -> {
                            throw new AppException(ErrorCode.DUPLICATE_REVIEW);
                        });
                review.setFlashcardDeck(deck);
            }
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        }

        // Bước 4: Lưu vào DB
        review = marketReviewRepository.save(review);

        log.info("Community review created: id={}, userId={}, targetType={}, targetId={}",
                review.getId(), userId, targetType, targetId);

        // Bước 5: Chuyển entity → DTO response
        return toResponse(review, targetType, targetId);
    }

    // ── 2. Cập nhật đánh giá cộng đồng ────────────────────────────────────────

    /**
     * Cập nhật một đánh giá cộng đồng đã tồn tại.
     * <p>
     * Chỉ tác giả (người tạo) mới được phép cập nhật.
     * Cập nhật rating và nội dung bình luận.
     *
     * @param id      ID của đánh giá cần cập nhật
     * @param request dữ liệu cập nhật mới
     * @return CommunityReviewResponse chứa thông tin sau khi cập nhật
     */
    @Transactional
    public CommunityReviewResponse updateReview(Long id, CommunityReviewRequest request) {
        // Bước 1: Lấy user hiện tại
        User currentUser = userService.getCurrentUser();

        // Bước 2: Tìm review theo ID, phải là community review (voteResult = null)
        MarketReview review = marketReviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        // Kiểm tra đây có phải community review không (voteResult phải null)
        if (review.getVoteResult() != null) {
            throw new AppException(ErrorCode.REVIEW_NOT_FOUND);
        }

        // Bước 3: Kiểm tra quyền – chỉ tác giả mới được cập nhật
        if (!review.getReviewer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Bước 4: Cập nhật rating và nội dung
        review.setRating(request.getRating());
        review.setReviewNote(request.getContent());
        review = marketReviewRepository.save(review);

        // Bước 5: Xác định targetType và targetId để trả response
        String targetType = resolveTargetType(review);
        Long targetId = resolveTargetId(review);

        log.info("Community review updated: id={}, userId={}", id, currentUser.getId());

        return toResponse(review, targetType, targetId);
    }

    // ── 3. Xóa đánh giá cộng đồng ────────────────────────────────────────────

    /**
     * Xóa một đánh giá cộng đồng.
     * <p>
     * Chỉ tác giả (người tạo) mới được phép xóa.
     *
     * @param id ID của đánh giá cần xóa
     */
    @Transactional
    public void deleteReview(Long id) {
        // Bước 1: Lấy user hiện tại
        User currentUser = userService.getCurrentUser();

        // Bước 2: Tìm review theo ID
        MarketReview review = marketReviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        // Kiểm tra đây có phải community review không
        if (review.getVoteResult() != null) {
            throw new AppException(ErrorCode.REVIEW_NOT_FOUND);
        }

        // Bước 3: Kiểm tra quyền – chỉ tác giả mới được xóa
        if (!review.getReviewer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        // Bước 4: Xóa khỏi DB
        marketReviewRepository.delete(review);

        log.info("Community review deleted: id={}, userId={}", id, currentUser.getId());
    }

    // ── 4. Lấy danh sách đánh giá cộng đồng (phân trang) ──────────────────────

    /**
     * Lấy danh sách đánh giá cộng đồng cho một tài nguyên cụ thể.
     * <p>
     * Lọc theo targetType + targetId, chỉ lấy các bản ghi có voteResult = null
     * (community review, không phải marketplace approval).
     * Sắp xếp mới nhất trước (created_at DESC).
     *
     * @param targetType loại tài nguyên: DOCUMENT, QUIZ, FLASHCARD_DECK
     * @param targetId   ID của tài nguyên
     * @param page       trang hiện tại (mặc định 0)
     * @param size       kích thước trang (mặc định 10)
     * @return PaginationResponse chứa danh sách đánh giá
     */
    @Transactional(readOnly = true)
    public PaginationResponse<CommunityReviewResponse> getReviews(
            String targetType, Long targetId, int page, int size) {

        // Chuẩn hóa targetType
        String normalizedType = normalizeTargetType(targetType);

        // Tạo Pageable sắp xếp mới nhất trước
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Truy vấn theo loại tài nguyên, chỉ lấy community review (voteResult IS NULL)
        Page<MarketReview> reviewPage = switch (normalizedType) {
            case "DOCUMENT" -> marketReviewRepository
                    .findByDocumentIdAndVoteResultIsNull(targetId, pageable);
            case "QUIZ" -> marketReviewRepository
                    .findByQuizIdAndVoteResultIsNull(targetId, pageable);
            case "FLASHCARD_DECK" -> marketReviewRepository
                    .findByFlashcardDeckIdAndVoteResultIsNull(targetId, pageable);
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid targetType. Must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        };

        // Chuyển đổi Page<Entity> → PaginationResponse<DTO>
        Page<CommunityReviewResponse> responsePage = reviewPage.map(
                review -> toResponse(review, normalizedType, targetId));

        return PaginationResponse.of(responsePage);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private helper methods
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Chuẩn hóa targetType về uppercase và validate giá trị hợp lệ.
     */
    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "targetType is required");
        }
        return targetType.trim().toUpperCase();
    }

    /**
     * Xác định targetType từ entity MarketReview dựa vào FK nào không null.
     */
    private String resolveTargetType(MarketReview review) {
        if (review.getDocument() != null) return "DOCUMENT";
        if (review.getQuiz() != null) return "QUIZ";
        if (review.getFlashcardDeck() != null) return "FLASHCARD_DECK";
        return "UNKNOWN";
    }

    /**
     * Xác định targetId từ entity MarketReview dựa vào FK nào không null.
     */
    private Long resolveTargetId(MarketReview review) {
        if (review.getDocument() != null) return review.getDocument().getId();
        if (review.getQuiz() != null) return review.getQuiz().getId();
        if (review.getFlashcardDeck() != null) return review.getFlashcardDeck().getId();
        return null;
    }

    /**
     * Chuyển đổi MarketReview entity → CommunityReviewResponse DTO.
     * Map review_note → content, bổ sung reviewerName và reviewerAvatarUrl.
     */
    private CommunityReviewResponse toResponse(MarketReview review, String targetType, Long targetId) {
        User reviewer = review.getReviewer();
        return CommunityReviewResponse.builder()
                .id(review.getId())
                .targetType(targetType)
                .targetId(targetId)
                .rating(review.getRating())
                .content(review.getReviewNote())           // review_note → content
                .reviewerId(reviewer != null ? reviewer.getId() : null)
                .reviewerName(reviewer != null ? reviewer.getFullName() : null)
                .reviewerAvatarUrl(reviewer != null ? reviewer.getAvatarUrl() : null)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
