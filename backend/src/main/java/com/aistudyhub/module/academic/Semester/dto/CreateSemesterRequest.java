package com.aistudyhub.module.academic.Semester.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSemesterRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;
}
