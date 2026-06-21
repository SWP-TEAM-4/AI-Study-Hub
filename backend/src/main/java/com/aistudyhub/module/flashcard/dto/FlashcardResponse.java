package com.aistudyhub.module.flashcard.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String frontText;
    private String backText;
}
