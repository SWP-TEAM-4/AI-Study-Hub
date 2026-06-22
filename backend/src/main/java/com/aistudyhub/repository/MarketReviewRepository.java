package com.aistudyhub.repository;

import com.aistudyhub.entity.MarketReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for MarketReview entity.
 * Owner: BE3 (Task BE-030)
 */
@Repository
public interface MarketReviewRepository extends JpaRepository<MarketReview, Long> {
    long countByDocumentId(Long documentId);
    long countByDocumentIdAndVoteResult(Long documentId, String voteResult);

    long countByQuizId(Long quizId);
    long countByQuizIdAndVoteResult(Long quizId, String voteResult);

    long countByFlashcardDeckId(Long flashcardDeckId);
    long countByFlashcardDeckIdAndVoteResult(Long flashcardDeckId, String voteResult);
}
