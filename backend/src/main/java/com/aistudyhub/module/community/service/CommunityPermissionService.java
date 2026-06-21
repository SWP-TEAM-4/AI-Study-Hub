package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CommunityPermissionService {

    private final CommunityRoleRepository communityRoleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public boolean hasCommunityPermission(Long userId,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId) {

        if (isAdmin(userId)) {
            return true;
        }

        LocalDateTime now = LocalDateTime.now();
        List<CommunityRole> roles = communityRoleRepository.findActiveRolesByUserIdAndRoleType(
                userId,
                roleType,
                CommunityRoleStatus.ACTIVE,
                now);

        return roles.stream().anyMatch(role -> matchesScope(role, scopeType, scopeId));
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermission(Long userId, CommunityScopeType scopeType, Long scopeId) {
        return hasCommunityPermission(userId, CommunityRoleType.REVIEWER, scopeType, scopeId)
                || hasCommunityPermission(userId, CommunityRoleType.MARKETPLACE_REVIEWER, scopeType, scopeId);
    }

    @Transactional(readOnly = true)
    public void assertReviewerPermission(Long userId, CommunityScopeType scopeType, Long scopeId) {
        if (!hasReviewerPermission(userId, scopeType, scopeId)) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_PERMISSION_DENIED);
        }
    }

    private boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == Role.ADMIN)
                .orElse(false);
    }

    private boolean matchesScope(CommunityRole role, CommunityScopeType requestedScopeType, Long requestedScopeId) {
        if (role.getStatus() != CommunityRoleStatus.ACTIVE) {
            return false;
        }

        CommunityScopeType grantedScopeType = role.getScopeType();
        if (grantedScopeType == null || grantedScopeType == CommunityScopeType.GLOBAL) {
            return true;
        }

        if (requestedScopeType == null) {
            return true;
        }

        return grantedScopeType == requestedScopeType
                && Objects.equals(role.getScopeId(), requestedScopeId);
    }
}
