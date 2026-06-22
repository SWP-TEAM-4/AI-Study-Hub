package com.aistudyhub.module.chat.dto.practice;

import com.aistudyhub.common.enums.AiPracticeDifficulty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeGenerationMetadata {
    private String language;
    private AiPracticeDifficulty difficulty;
    private Integer requestedQuestionCount;
    private Integer generatedQuestionCount;
    private Integer requestedCardCount;
    private Integer generatedCardCount;
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
