package com.aistudyhub.module.quiz.dto;

import java.util.List;

import com.aistudyhub.common.enums.QuestionType;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestQuestionResponse {
    private Long id;
    private String questionText;
    private QuestionType questionType;
    private List<TestOptionResponse> options; // Danh sách các đáp án của câu hỏi này
    private UserAnswerResponse userProgress; // Tiến trình làm bài của user đối với câu hỏi này
}
