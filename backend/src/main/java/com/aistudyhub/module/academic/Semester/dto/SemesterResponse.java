package com.aistudyhub.module.academic.Semester.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SemesterResponse {
    private Long id;
    private String code;
    private String name;
}
