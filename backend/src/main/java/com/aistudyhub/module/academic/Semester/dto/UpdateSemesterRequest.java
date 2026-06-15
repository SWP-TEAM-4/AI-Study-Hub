package com.aistudyhub.module.academic.Semester.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateSemesterRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
}