package com.aistudyhub.module.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ContributorLeaderboardItemResponse {

    private Integer rank;
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private Integer reputationPoints;
    private Long approvedContents;
    private Long downloadCount;
    private Long reviewCount;
    private BigDecimal acceptPercentage;
}
