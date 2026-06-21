package com.aistudyhub.module.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCommunityRoleRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Role type is required")
    private String roleType;

    private String scopeType;

    private Long scopeId;

    private LocalDateTime startAt;

    private LocalDateTime endAt;
}
