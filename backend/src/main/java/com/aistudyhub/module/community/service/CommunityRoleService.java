package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.CommunityRoleResponse;
import com.aistudyhub.module.community.dto.CreateCommunityRoleRequest;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityRoleService {

    private final CommunityRoleRepository communityRoleRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final NotificationService notificationService;

    @Transactional
    public CommunityRoleResponse grantRole(CreateCommunityRoleRequest request, Long grantedByUserId) {
        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User grantedBy = userRepository.findById(grantedByUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        CommunityRoleType roleType = parseRoleType(request.getRoleType());
        CommunityScopeType scopeType = parseScopeType(request.getScopeType());

        validateTimeRange(request.getStartAt(), request.getEndAt());
        validateScope(scopeType, request.getScopeId());

        if (communityRoleRepository.existsOverlappingActiveRole(
                targetUser.getId(),
                roleType,
                scopeType,
                request.getScopeId(),
                CommunityRoleStatus.ACTIVE,
                LocalDateTime.now())) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_ALREADY_ACTIVE);
        }

        CommunityRole communityRole = CommunityRole.builder()
                .user(targetUser)
                .grantedBy(grantedBy)
                .roleType(roleType)
                .scopeType(scopeType)
                .scopeId(request.getScopeId())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .status(CommunityRoleStatus.ACTIVE)
                .build();

        CommunityRole saved = communityRoleRepository.save(communityRole);
        notificationService.createNotification(
                targetUser.getId(),
                "Community role granted",
                buildGrantNotificationContent(saved));
        log.info("Granted community role {} for userId={} by adminId={} scopeType={} scopeId={}",
                roleType, targetUser.getId(), grantedByUserId, scopeType, request.getScopeId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CommunityRoleResponse> getMyRoles(Long currentUserId) {
        LocalDateTime now = LocalDateTime.now();
        return communityRoleRepository.findCurrentRolesByUserId(currentUserId, CommunityRoleStatus.ACTIVE, now)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginationResponse<CommunityRoleResponse> searchRoles(String keyword,
            Long userId,
            String roleType,
            String status,
            String scopeType,
            Long scopeId,
            int page,
            int size,
            String sort) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<CommunityRoleResponse> result = communityRoleRepository.searchRoles(
                normalizeKeyword(keyword),
                userId,
                parseRoleTypeOrNull(roleType),
                parseStatusOrNull(status),
                parseScopeTypeOrNull(scopeType),
                scopeId,
                pageable)
                .map(this::toResponse);

        return PaginationResponse.of(result);
    }

    @Transactional
    public CommunityRoleResponse revokeRole(Long id, Long revokedByUserId, String reason) {
        CommunityRole communityRole = communityRoleRepository.findDetailedById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMMUNITY_ROLE_NOT_FOUND));

        communityRole.setStatus(CommunityRoleStatus.REVOKED);
        CommunityRole saved = communityRoleRepository.save(communityRole);
        notificationService.createNotification(
                communityRole.getUser().getId(),
                "Community role revoked",
                buildRevokeNotificationContent(saved, reason));

        if (StringUtils.hasText(reason)) {
            log.info("Revoked community role id={} by adminId={} reason={}", id, revokedByUserId, reason.trim());
        } else {
            log.info("Revoked community role id={} by adminId={}", id, revokedByUserId);
        }

        return toResponse(saved);
    }

    private CommunityRoleResponse toResponse(CommunityRole communityRole) {
        return CommunityRoleResponse.builder()
                .id(communityRole.getId())
                .userId(communityRole.getUser().getId())
                .grantedByUserId(communityRole.getGrantedBy() != null ? communityRole.getGrantedBy().getId() : null)
                .roleType(communityRole.getRoleType())
                .scopeType(communityRole.getScopeType())
                .scopeId(communityRole.getScopeId())
                .startAt(communityRole.getStartAt())
                .endAt(communityRole.getEndAt())
                .status(resolveDisplayStatus(communityRole))
                .createdAt(communityRole.getCreatedAt())
                .build();
    }

    private CommunityRoleStatus resolveDisplayStatus(CommunityRole communityRole) {
        if (communityRole.getStatus() == CommunityRoleStatus.REVOKED) {
            return CommunityRoleStatus.REVOKED;
        }
        if (communityRole.getEndAt() != null && communityRole.getEndAt().isBefore(LocalDateTime.now())) {
            return CommunityRoleStatus.EXPIRED;
        }
        return communityRole.getStatus();
    }

    private void validateScope(CommunityScopeType scopeType, Long scopeId) {
        if (scopeType == CommunityScopeType.GLOBAL) {
            if (scopeId != null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "scopeId must be null when scopeType is GLOBAL");
            }
            return;
        }

        if (scopeId == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "scopeId is required when scopeType is not GLOBAL");
        }

        boolean exists = switch (scopeType) {
            case SUBJECT -> subjectRepository.existsById(scopeId);
            case DOCUMENT -> documentRepository.existsById(scopeId);
            case QUIZ -> quizRepository.existsById(scopeId);
            case FLASHCARD_DECK -> flashcardDeckRepository.existsById(scopeId);
            case GLOBAL -> true;
        };

        if (!exists) {
            throw switch (scopeType) {
                case SUBJECT -> new AppException(ErrorCode.SUBJECT_NOT_FOUND);
                case DOCUMENT -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                case QUIZ -> new AppException(ErrorCode.QUIZ_NOT_FOUND);
                case FLASHCARD_DECK -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND);
                case GLOBAL -> new AppException(ErrorCode.VALIDATION_ERROR, "Invalid scope configuration");
            };
        }
    }

    private void validateTimeRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt != null && endAt != null && endAt.isBefore(startAt)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "endAt must be after or equal to startAt");
        }
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private CommunityRoleType parseRoleType(String rawRoleType) {
        if (!StringUtils.hasText(rawRoleType)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "roleType is required");
        }
        try {
            return CommunityRoleType.valueOf(rawRoleType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid roleType: " + rawRoleType);
        }
    }

    private CommunityRoleType parseRoleTypeOrNull(String rawRoleType) {
        if (!StringUtils.hasText(rawRoleType)) {
            return null;
        }
        return parseRoleType(rawRoleType);
    }

    private CommunityScopeType parseScopeType(String rawScopeType) {
        if (!StringUtils.hasText(rawScopeType)) {
            return CommunityScopeType.GLOBAL;
        }
        try {
            return CommunityScopeType.valueOf(rawScopeType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid scopeType: " + rawScopeType);
        }
    }

    private CommunityScopeType parseScopeTypeOrNull(String rawScopeType) {
        if (!StringUtils.hasText(rawScopeType)) {
            return null;
        }
        return parseScopeType(rawScopeType);
    }

    private CommunityRoleStatus parseStatusOrNull(String rawStatus) {
        if (!StringUtils.hasText(rawStatus)) {
            return null;
        }
        try {
            return CommunityRoleStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid status: " + rawStatus);
        }
    }

    private String buildGrantNotificationContent(CommunityRole communityRole) {
        StringBuilder content = new StringBuilder()
                .append("You have been granted role ")
                .append(communityRole.getRoleType());

        appendScope(content, communityRole);
        appendTimeRange(content, communityRole);
        content.append(".");

        return content.toString();
    }

    private String buildRevokeNotificationContent(CommunityRole communityRole, String reason) {
        StringBuilder content = new StringBuilder()
                .append("Your role ")
                .append(communityRole.getRoleType())
                .append(" has been revoked");

        appendScope(content, communityRole);
        if (StringUtils.hasText(reason)) {
            content.append(". Reason: ").append(reason.trim());
        } else {
            content.append(".");
        }

        return content.toString();
    }

    private void appendScope(StringBuilder content, CommunityRole communityRole) {
        CommunityScopeType scopeType = communityRole.getScopeType();
        if (scopeType == null || scopeType == CommunityScopeType.GLOBAL) {
            content.append(" with GLOBAL scope");
            return;
        }

        content.append(" with ")
                .append(scopeType)
                .append(" scope");

        if (communityRole.getScopeId() != null) {
            content.append(" #").append(communityRole.getScopeId());
        }
    }

    private void appendTimeRange(StringBuilder content, CommunityRole communityRole) {
        if (communityRole.getStartAt() == null && communityRole.getEndAt() == null) {
            return;
        }

        content.append(" effective");
        if (communityRole.getStartAt() != null) {
            content.append(" from ").append(communityRole.getStartAt());
        }
        if (communityRole.getEndAt() != null) {
            content.append(" until ").append(communityRole.getEndAt());
        }
    }
}
