package com.aistudyhub.module.subject.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubjectResponse {
    private Long id;
    private String code;
    private String name;
    private Integer standardSemesterNumber;

}
