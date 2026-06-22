package com.aistudyhub.module.chat.dto.practice;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardGeneratedPayload {
    private String type;
    private String title;
    private String description;
    private PracticeGenerationMetadata metadata;
    @Builder.Default
    private List<FlashcardGeneratedCard> cards = new ArrayList<>();
}
