package com.aistudyhub.module.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDocumentRequest {
    @NotBlank
    private String title;

    private String description;

    private Long subjectId;

    private String fileUrl;

    private String cloudFilePath;

    private String fileType;

    private Long fileSize;
}
