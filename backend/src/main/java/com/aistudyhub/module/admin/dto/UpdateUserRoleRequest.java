package com.aistudyhub.module.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRoleRequest {

    @NotBlank(message = "Role is required")
    private String role;
}
