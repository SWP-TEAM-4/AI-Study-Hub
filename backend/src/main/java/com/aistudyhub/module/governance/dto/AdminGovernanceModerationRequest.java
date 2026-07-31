package com.aistudyhub.module.governance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminGovernanceModerationRequest {

    @NotBlank(message = "reason is required")
    @Size(max = 1000, message = "reason must be at most 1000 characters")
    private String reason;
}
