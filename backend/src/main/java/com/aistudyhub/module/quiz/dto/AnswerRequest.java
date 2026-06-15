package com.aistudyhub.module.quiz.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerRequest {
    @NotNull(message = "Question ID is required")
    private Long questionId;
    private Long selectedOptionId;
    private String userAnswerText;

}
