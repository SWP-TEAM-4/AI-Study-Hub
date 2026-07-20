package com.aistudyhub.module.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for manually correcting extracted/chunked document text.
 */
@Getter
@Setter
public class UpdateDocumentChunkRequest {

    @NotBlank(message = "Chunk text content must not be blank")
    private String textContent;
}
