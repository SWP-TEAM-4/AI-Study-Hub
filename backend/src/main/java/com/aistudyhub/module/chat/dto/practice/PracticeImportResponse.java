package com.aistudyhub.module.chat.dto.practice;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.PracticeImportTargetMode;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.enums.PracticeStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PracticeImportResponse {
    private Long messageId;
    private AiPracticeType practiceType;
    private PracticeImportTargetMode targetMode;
    private PracticeImportTargetType targetType;
    private Long targetId;
    private Long createdQuizId;
    private Long createdDeckId;
    private Integer createdQuestions;
    private Integer createdOptions;
    private Integer createdCards;
    private Integer skippedDuplicates;
    private PracticeStatus practiceStatus;
    private LocalDateTime importedAt;
}
