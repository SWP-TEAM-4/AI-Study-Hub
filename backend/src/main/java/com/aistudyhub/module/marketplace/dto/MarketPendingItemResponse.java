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
    private LocalDateTime submittedAt;
}
