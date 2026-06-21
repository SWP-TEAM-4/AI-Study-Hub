package com.aistudyhub.module.systemconfig.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemConfigRequest {

    @NotBlank(message = "Config key is required")
    @Size(max = 100, message = "Config key must not exceed 100 characters")
    private String configKey;

    @NotBlank(message = "Config value is required")
    private String configValue;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @JsonProperty("isPublic")
    private Boolean isPublic;
}
