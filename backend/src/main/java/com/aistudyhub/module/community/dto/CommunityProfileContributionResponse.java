package com.aistudyhub.module.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityProfileContributionResponse {
    private String targetType;
    private Long targetId;
    private String title;
    private Long subjectId;
    private String subjectCode;
    private Integer downloadCount;
    private Integer communityReviewCount;
    private BigDecimal communityRatingAvg;
    private LocalDateTime approvedAt;
}
