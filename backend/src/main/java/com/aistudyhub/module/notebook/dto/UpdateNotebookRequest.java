package com.aistudyhub.module.notebook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateNotebookRequest {
    @NotBlank
    private String title;
    @NotNull
    private Long subjectId;
}
