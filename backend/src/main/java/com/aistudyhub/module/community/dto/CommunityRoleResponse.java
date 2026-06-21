package com.aistudyhub.module.community.dto;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityRoleResponse {

    private Long id;
    private Long userId;
    private Long grantedByUserId;
    private CommunityRoleType roleType;
    private CommunityScopeType scopeType;
    private Long scopeId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private CommunityRoleStatus status;
    private LocalDateTime createdAt;
}
