package com.aistudyhub.module.subject.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateSubjectRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;
    private Integer standardSemesterNumber;
}
