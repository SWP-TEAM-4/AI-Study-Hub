package com.aistudyhub.module.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateDocumentSafetySettingsRequest {

    @NotNull(message = "enabled is required")
    private Boolean enabled;
}
