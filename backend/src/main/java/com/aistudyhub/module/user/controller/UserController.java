package com.aistudyhub.module.user.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.user.dto.ChangePasswordRequest;
import com.aistudyhub.module.user.dto.UpdateProfileRequest;
import com.aistudyhub.module.user.dto.UserProfileResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.module.user.dto.UserCapabilitiesResponse;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Owner: BE1
 * Base URL: /api/users
 */
@Tag(name = "User Profile", description = "Xem và cập nhật thông tin cá nhân")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CommunityPermissionService communityPermissionService;

    @Operation(summary = "Xem profile của chính mình")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyProfile()));
    }

    @GetMapping("/me/capabilities")
    public ResponseEntity<ApiResponse<UserCapabilitiesResponse>> getMyCapabilities(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(communityPermissionService.getCapabilities(principal.getId())));
    }

    @Operation(summary = "Cập nhật profile (tên, avatar, semester, combo)")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateMyProfile(request)));
    }

    @Operation(summary = "Đổi mật khẩu (cần nhập mật khẩu hiện tại)")
    @PatchMapping("/me/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
