package com.aistudyhub.repository;

import com.aistudyhub.entity.MarketReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for MarketReview entity.
 * Owner: BE3 (Task BE-030, BE-042)
 */
public interface MarketReviewRepository extends JpaRepository<MarketReview, Long> {

    // ── Marketplace review statistics (BE-030) ────────────────────────────────
    long countByDocumentId(Long documentId);

    long countByDocumentIdAndVoteResult(Long documentId, String voteResult);

    long countByQuizId(Long quizId);

    long countByQuizIdAndVoteResult(Long quizId, String voteResult);

    long countByFlashcardDeckId(Long flashcardDeckId);

    long countByFlashcardDeckIdAndVoteResult(Long flashcardDeckId, String voteResult);

    // ── Community review: kiểm tra trùng lặp (voteResult IS NULL = review cộng đồng) ──
    Optional<MarketReview> findByReviewerIdAndDocumentIdAndVoteResultIsNull(Long reviewerId, Long documentId);

    Optional<MarketReview> findByReviewerIdAndQuizIdAndVoteResultIsNull(Long reviewerId, Long quizId);

    Optional<MarketReview> findByReviewerIdAndFlashcardDeckIdAndVoteResultIsNull(Long reviewerId, Long flashcardDeckId);

    // ── Community review: phân trang danh sách (voteResult IS NULL) ──────────
    Page<MarketReview> findByDocumentIdAndVoteResultIsNull(Long documentId, Pageable pageable);

    Page<MarketReview> findByQuizIdAndVoteResultIsNull(Long quizId, Pageable pageable);

    Page<MarketReview> findByFlashcardDeckIdAndVoteResultIsNull(Long flashcardDeckId, Pageable pageable);
}
