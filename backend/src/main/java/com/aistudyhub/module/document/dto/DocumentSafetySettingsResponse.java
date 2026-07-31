package com.aistudyhub.module.document.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentSafetySettingsResponse {

    private String configKey;
    private boolean enabled;
    private String description;
}
