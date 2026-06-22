package com.aistudyhub.module.chat.dto;

import com.aistudyhub.common.enums.AiPracticeDifficulty;
import com.aistudyhub.common.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateChatMessageRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content must be at most 4000 characters")
    private String content;

    @Min(value = 1, message = "topK must be at least 1")
    @Max(value = 10, message = "topK must be at most 10")
    private Integer topK;

    private List<Long> documentIds;

    @Size(max = 10, message = "language must be at most 10 characters")
    private String language;

    @Valid
    private PracticeGenerationOptions options;

    @Getter
    @Setter
    public static class PracticeGenerationOptions {
        @Min(value = 1, message = "numberOfQuestions must be at least 1")
        @Max(value = 30, message = "numberOfQuestions must be at most 30")
        private Integer numberOfQuestions;

        @Min(value = 1, message = "numberOfCards must be at least 1")
        @Max(value = 50, message = "numberOfCards must be at most 50")
        private Integer numberOfCards;

        private QuestionType questionType;

        private AiPracticeDifficulty difficulty;
    }
}
