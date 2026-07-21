package com.aistudyhub.module.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityProfileReviewResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetTitle;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;
}
