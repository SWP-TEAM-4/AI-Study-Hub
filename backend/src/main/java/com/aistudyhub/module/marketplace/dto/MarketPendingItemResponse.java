package com.aistudyhub.module.marketplace.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO representing an item in the pending marketplace review queue.
 * Owner: BE3 (Task BE-030)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPendingItemResponse {
    private String targetType; // "DOCUMENT", "QUIZ", "FLASHCARD_DECK"
    private Long targetId;
    private String title;
    // Có giá trị với DOCUMENT để màn kiểm duyệt mở file mà không cần gọi API khác.
    private String fileUrl;
    private String fileType;
    private String submissionNote;
    private LocalDateTime submittedAt;
    private Long subjectId;
    private Long ownerId;
    private boolean adminRequired;
    private String policyMode;
    private Integer requiredVotes;
}
