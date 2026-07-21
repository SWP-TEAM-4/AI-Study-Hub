package com.aistudyhub.module.flashcard.dto;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDeckResponse {
    private Long id;
    private Long userId;
    private Long notebookId;
    private Long subjectId;
    private String title;
    private Visibility visibility;
    private MarketStatus marketStatus;
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private Integer communityReviewCount;
    private BigDecimal communityRatingAvg;
    private Long clonedFromId;
    private LocalDateTime createdAt;
    private List<FlashcardResponse> cards;
}
