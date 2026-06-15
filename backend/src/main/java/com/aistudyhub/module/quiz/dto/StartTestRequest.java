package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.QuizSelectionMode;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StartTestRequest {

    private String title;

    private Integer duration;

    @NotNull(message = "Selection mode is required")
    private QuizSelectionMode quizSelectionMode; // ALL, SELECTED, RANDOM

    private List<Long> questionIds; // Danh sách ID tự chọn (Dùng cho SELECTED)

    private Integer randomCount; // Số lượng câu bốc ngẫu nhiên (Dùng cho RANDOM)

    private Boolean shuffleQuestions; // Có tráo thứ tự câu hỏi hay không (Trộn đề)

    private Boolean shuffleOptions; // Có tráo thứ tự các phương án lựa chọn trong câu hỏi hay không
}