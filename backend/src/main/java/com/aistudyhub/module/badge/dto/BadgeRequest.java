package com.aistudyhub.module.badge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BadgeRequest {

    @NotBlank(message = "Badge name is required")
    @Size(max = 100, message = "Badge name must not exceed 100 characters")
    private String name;

    private String description;

    @Size(max = 500, message = "Icon URL must not exceed 500 characters")
    private String iconUrl;
}
