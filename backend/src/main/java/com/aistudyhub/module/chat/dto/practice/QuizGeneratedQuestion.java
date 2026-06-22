package com.aistudyhub.module.chat.dto.practice;

import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.module.quiz.dto.OptionRequest;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizGeneratedQuestion {
    private String questionText;
    private QuestionType questionType;
    private String explanation;
    @Builder.Default
    private List<OptionRequest> options = new ArrayList<>();
    @Builder.Default
    private List<PracticeSourceRef> sourceRefs = new ArrayList<>();
}
