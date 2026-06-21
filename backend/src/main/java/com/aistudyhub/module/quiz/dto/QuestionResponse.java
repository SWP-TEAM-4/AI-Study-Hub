package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.QuestionType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QuestionResponse {
    private Long id;
    private Long quizId;
    private String questionText;
    private QuestionType questionType;
    private String explanation;
    private List<OptionResponse> options;
}
