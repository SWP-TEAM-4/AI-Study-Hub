package com.aistudyhub.module.auth.dto;

import com.aistudyhub.common.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Response trả về sau login/register thành công.
 * KHÔNG chứa passwordHash.
 */
@Getter
@Builder
public class AuthResponse {

    private String accessToken;
    private String tokenType;

    // User basic info
    private Long userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Role role;
    private Integer reputationPoints;
    private LocalDateTime createdAt;
}
