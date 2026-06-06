package com.aistudyhub.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be 6–100 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 255, message = "Full name must be 2–255 characters")
    private String fullName;

    private Long currentSemesterId;
    private Long comboId;
}
