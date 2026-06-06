package com.aistudyhub.module.user.dto;

import com.aistudyhub.common.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Profile response – KHÔNG chứa passwordHash.
 */
@Getter
@Builder
public class UserProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Role role;
    private Integer reputationPoints;
    private Boolean isActive;

    // Academic info
    private Long currentSemesterId;
    private String currentSemesterCode;
    private String currentSemesterName;

    private Long comboId;
    private String comboCode;
    private String comboName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
