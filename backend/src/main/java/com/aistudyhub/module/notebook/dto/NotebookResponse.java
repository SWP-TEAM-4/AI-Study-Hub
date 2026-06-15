package com.aistudyhub.module.notebook.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotebookResponse {
    private Long id;
    private String title;
    private Long subjectId;
    private LocalDateTime createdAt;
}
