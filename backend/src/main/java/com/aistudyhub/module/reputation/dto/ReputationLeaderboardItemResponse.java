package com.aistudyhub.module.reputation.dto;

import com.aistudyhub.module.badge.dto.BadgeResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReputationLeaderboardItemResponse {
    private Integer rank;
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private Long score;
    private Long eventCount;
    private List<BadgeResponse> badges;
}
