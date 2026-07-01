package com.aistudyhub.module.marketplace.dto;

import com.aistudyhub.common.enums.ReviewPolicyMode;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class ReviewPolicyResponse {
    private Long subjectId;
    private ReviewPolicyMode mode;
    private Integer requiredVotes;
    private Integer approvalPercentage;
    private Boolean subjectOverride;
}
