package com.aistudyhub.module.quiz.dto;

import java.util.List;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswerResponse {
    private Long selectedOptionId;
    private List<Long> selectedOptionIds;
    private String userAnswerText;
}
