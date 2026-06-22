package com.aistudyhub.module.chat.dto.practice;

import com.aistudyhub.common.enums.PracticeImportTargetMode;
import com.aistudyhub.common.enums.Visibility;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PracticeImportRequest {

    @NotNull(message = "targetMode is required")
    private PracticeImportTargetMode targetMode;

    @Valid
    @NotNull(message = "target is required")
    private Target target;

    @Valid
    private ImportOptions importOptions;

    @Getter
    @Setter
    public static class Target {
        @Size(max = 255, message = "title cannot exceed 255 characters")
        private String title;
        private String description;
        private Long notebookId;
        private Long subjectId;
        private Visibility visibility;
        private Long quizId;
        private Long deckId;
    }

    @Getter
    @Setter
    public static class ImportOptions {
        private Boolean skipDuplicateQuestions;
        private Boolean shuffleQuestions;
        private Boolean skipDuplicateCards;
    }
}
