package com.aistudyhub.module.user.service;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.user.dto.ChangePasswordRequest;
import com.aistudyhub.module.user.dto.UpdateProfileRequest;
import com.aistudyhub.module.user.dto.UserProfileResponse;
import com.aistudyhub.repository.ComboRepository;
import com.aistudyhub.repository.SemesterRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * Owner: BE1
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final ComboRepository comboRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Get current user ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return toProfileResponse(user);
    }

    // ── Update profile ────────────────────────────────────────────────────────

    @Transactional
    public UserProfileResponse updateMyProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getCurrentSemesterId() != null) {
            var semester = semesterRepository.findById(request.getCurrentSemesterId())
                    .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND));
            user.setCurrentSemester(semester);
        }
        if (request.getComboId() != null) {
            var combo = comboRepository.findById(request.getComboId())
                    .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
            user.setCombo(combo);
        }

        user = userRepository.save(user);
        return toProfileResponse(user);
    }

    // ── Change password ───────────────────────────────────────────────────────

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.SAME_PASSWORD);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for userId={}", user.getId());
    }

    // ── Admin: get any user profile ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<UserProfileResponse> searchUsers(
            String keyword,
            String roleName,
            Boolean isActive,
            org.springframework.data.domain.Pageable pageable) {
        return userRepository.searchUsers(
                normalizeKeyword(keyword),
                parseRoleOrNull(roleName),
                isActive,
                pageable)
                .map(this::toProfileResponse);
    }

    @Transactional
    public UserProfileResponse setUserActive(Long userId, boolean active, Long adminId) {
        if (userId.equals(adminId) && !active) {
            throw new AppException(ErrorCode.CANNOT_DEACTIVATE_SELF);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setIsActive(active);
        user = userRepository.save(user);
        log.info("Admin {} set user {} active={}", adminId, userId, active);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse changeUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Role role = parseAdminManagedRole(roleName);
        user.setRole(role);
        user = userRepository.save(user);
        log.info("User {} role changed to {}", userId, role);
        return toProfileResponse(user);
    }

    // ── Helper: get authenticated user ────────────────────────────────────────

    public User getCurrentUser() {
        CustomUserDetails principal = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        return userRepository.findByIdAndIsActiveTrue(principal.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public Long getCurrentUserId() {
        CustomUserDetails principal = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        return principal.getId();
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private Role parseRoleOrNull(String roleName) {
        if (!StringUtils.hasText(roleName)) {
            return null;
        }
        try {
            return Role.valueOf(roleName.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid role: " + roleName);
        }
    }

    private Role parseAdminManagedRole(String roleName) {
        Role role = parseRoleOrNull(roleName);
        if (role == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Role is required");
        }
        if (role != Role.STUDENT && role != Role.ADMIN) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Role must be STUDENT or ADMIN");
        }
        return role;
    }

    // ── Private mapping ───────────────────────────────────────────────────────

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .reputationPoints(user.getReputationPoints())
                .isActive(user.getIsActive())
                .currentSemesterId(user.getCurrentSemester() != null ? user.getCurrentSemester().getId() : null)
                .currentSemesterCode(user.getCurrentSemester() != null ? user.getCurrentSemester().getCode() : null)
                .currentSemesterName(user.getCurrentSemester() != null ? user.getCurrentSemester().getName() : null)
                .comboId(user.getCombo() != null ? user.getCombo().getId() : null)
                .comboCode(user.getCombo() != null ? user.getCombo().getCode() : null)
                .comboName(user.getCombo() != null ? user.getCombo().getName() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
