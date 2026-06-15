package com.aistudyhub.module.subject.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubjectRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;
    private Integer standardSemesterNumber;
}
