package com.aistudyhub.module.quiz.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswerResponse {
    private Long selectedOptionId;
    private String userAnswerText;
}
