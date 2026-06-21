package com.aistudyhub.module.quiz.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.aistudyhub.common.enums.QuizSelectionMode;
import com.aistudyhub.common.enums.TestStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class TestResponse {
    private Long id;
    private Long quizId;
    private String quizTitle;
    private Long userId;
    private String title;
    private BigDecimal totalScore;
    private Integer duration;
    private TestStatus status;
    private LocalDateTime createdAt;
    private List<TestQuestionResponse> questions; // Danh sách các câu hỏi trong đề thi
    private QuizSelectionMode selectionMode;
    private Integer randomCount;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private Integer totalQuestions;
}
