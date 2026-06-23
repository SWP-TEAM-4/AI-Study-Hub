package com.aistudyhub.module.community.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommunityCommentResponse {
    private Long id;

    private Long userId;

    private String fullName;

    private String avatarUrl;

    private String content;

    private Long parentCommentId;

    private LocalDateTime createdAt;
}
