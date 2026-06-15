package com.aistudyhub.module.quiz.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class TestOptionResponse {
    private Long id;
    private String optionText;
}
