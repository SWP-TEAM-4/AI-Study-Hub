package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    private String description;

    private Long notebookId;

    private Long subjectId;

    private Long academicTermId;

    @Size(max = 100, message = "Exam type cannot exceed 100 characters")
    private String examType;

    private Visibility visibility;
}
