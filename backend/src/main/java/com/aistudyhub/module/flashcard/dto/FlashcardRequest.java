package com.aistudyhub.module.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FlashcardRequest {

    @NotBlank(message = "Front text is required")
    private String frontText;

    @NotBlank(message = "Back text is required")
    private String backText;
}
