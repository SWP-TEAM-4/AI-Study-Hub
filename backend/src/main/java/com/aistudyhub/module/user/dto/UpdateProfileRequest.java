package com.aistudyhub.module.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Size(min = 2, max = 255, message = "Full name must be 2–255 characters")
    private String fullName;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    private String avatarUrl;

    private Long currentSemesterId;
    private Long comboId;
}
