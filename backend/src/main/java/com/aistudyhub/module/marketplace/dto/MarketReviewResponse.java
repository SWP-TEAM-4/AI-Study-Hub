package com.aistudyhub.module.marketplace.dto;

import com.aistudyhub.entity.MarketReview;
import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO representing the response after submitting a marketplace review.
 * Includes helper mapping methods to convert from Entity to DTO.
 * Owner: BE3 (Task BE-030)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketReviewResponse {
    private Long id;
    private Long reviewerId;
    private String targetType; // "DOCUMENT", "QUIZ", "FLASHCARD_DECK"
    private Long targetId;
    private String voteResult; // "APPROVED", "REJECTED"
    private String reviewNote;
    private LocalDateTime createdAt;
    private Long submissionId;
    private String submissionStatus;
    private Long approvedVotes;
    private Long rejectedVotes;
    private Long totalVotes;
    private Integer requiredVotes;
    private Integer approvalPercentageRequired;
    private boolean decisionReached;

    /**
     * Map MarketReview entity to MarketReviewResponse DTO.
     */
    public static MarketReviewResponse fromEntity(MarketReview review, String targetType, Long targetId) {
        if (review == null) {
            return null;
        }
        return MarketReviewResponse.builder()
                .id(review.getId())
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .targetType(targetType)
                .targetId(targetId)
                .voteResult(review.getVoteResult())
                .reviewNote(review.getReviewNote())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
