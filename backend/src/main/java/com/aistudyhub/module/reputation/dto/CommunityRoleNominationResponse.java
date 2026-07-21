package com.aistudyhub.module.reputation.dto;

import com.aistudyhub.common.enums.CommunityRoleNominationStatus;
import com.aistudyhub.common.enums.CommunityRoleNominationType;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityRoleNominationResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private Long subjectId;
    private String subjectCode;
    private CommunityRoleNominationType nominationType;
    private CommunityRoleType roleType;
    private CommunityScopeType scopeType;
    private Long scopeId;
    private String periodKey;
    private Integer score;
    private CommunityRoleNominationStatus status;
    private String reason;
    private LocalDateTime effectiveStartAt;
    private LocalDateTime effectiveEndAt;
    private Long reviewedByUserId;
    private LocalDateTime reviewedAt;
    private String reviewNote;
    private LocalDateTime createdAt;
}
