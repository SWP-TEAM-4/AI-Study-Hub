package com.aistudyhub.module.document.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotebookDocumentDeleteResponse {

    private boolean deleted;
}
