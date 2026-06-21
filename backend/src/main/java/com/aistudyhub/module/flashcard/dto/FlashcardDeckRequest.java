package com.aistudyhub.module.flashcard.dto;

import com.aistudyhub.common.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FlashcardDeckRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    private Long notebookId;

    private Long subjectId;

    private Visibility visibility;
}
