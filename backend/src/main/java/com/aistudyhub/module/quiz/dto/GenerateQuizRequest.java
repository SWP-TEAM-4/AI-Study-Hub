package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateQuizRequest {

    private Long notebookId;

    private Long documentId;

    @NotNull(message = "Number of questions is required")
    @Min(value = 1, message = "Number of questions must be at least 1")
    private Integer numberOfQuestions;

    private QuestionType questionType;
}
