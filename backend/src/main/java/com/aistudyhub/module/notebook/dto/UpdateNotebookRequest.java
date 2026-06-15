package com.aistudyhub.module.notebook.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateNotebookRequest {
    @NotBlank
    private String title;
    private Long subjectId;
}
