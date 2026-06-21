package com.aistudyhub.module.flashcard.dto;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FlashcardDeckSearchRequest {
    private String keyword;
    private Long subjectId;
    private Visibility visibility;
    private MarketStatus marketStatus;
}
