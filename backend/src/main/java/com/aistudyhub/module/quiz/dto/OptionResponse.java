package com.aistudyhub.module.quiz.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OptionResponse {
    private Long id;
    private String optionText;
    private Boolean isCorrect;
}
