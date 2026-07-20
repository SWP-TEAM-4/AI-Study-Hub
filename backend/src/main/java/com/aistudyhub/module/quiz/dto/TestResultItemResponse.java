package com.aistudyhub.module.quiz.dto;

import java.util.List;

import com.aistudyhub.common.enums.QuestionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/***
 * DTO chứa thông tin kết quả chi tiết của từng câu hỏi sau khi chấm điểm.
 * Trả về thông tin câu hỏi, dáp án học sinh đã chọn/điền, tính đúng sai và lời
 * giải thích
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResultItemResponse {
    private Long questionId;
    private String questionText;
    private QuestionType questionType;
    private Boolean isCorrect;
    private Long selectedOptionId;
    private String userAnswerText;
    private String explanation;
    private List<OptionResponse> options;

}
