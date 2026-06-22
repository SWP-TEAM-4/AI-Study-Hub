package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {
    private Long id;
    private Long notebookId;
    private String notebookTitle;
    private Long subjectId;
    private String subjectName;
    private Long creatorId;
    private String creatorFullName;
    private String title;
    private String description;
    private Long academicTermId;
    private String academicTermName;
    private String examType;
    private Visibility visibility;
    private MarketStatus marketStatus;
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private String aiVerdictNote;
    private Long clonedFromId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
