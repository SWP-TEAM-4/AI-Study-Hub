package com.aistudyhub.module.document.dto;

import com.aistudyhub.common.enums.Visibility;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateDocumentRequest {
    @NotBlank
    private String title;
    private String description;
    private Long subjectId;

    private Visibility visibility;
}
