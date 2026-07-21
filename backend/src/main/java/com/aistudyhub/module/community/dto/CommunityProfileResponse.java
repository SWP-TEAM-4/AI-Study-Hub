package com.aistudyhub.module.community.dto;

import com.aistudyhub.module.badge.dto.BadgeResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CommunityProfileResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private Integer reputationPoints;
    private LocalDateTime joinedAt;
    private List<BadgeResponse> badges;
    private List<CommunityProfileSubjectResponse> topSubjects;
    private List<CommunityProfileContributionResponse> contributions;
    private List<CommunityProfileReviewResponse> reviewHistory;
}
