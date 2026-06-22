package com.aistudyhub.module.chat.dto.practice;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardGeneratedCard {
    private String frontText;
    private String backText;
    @Builder.Default
    private List<PracticeSourceRef> sourceRefs = new ArrayList<>();
}
