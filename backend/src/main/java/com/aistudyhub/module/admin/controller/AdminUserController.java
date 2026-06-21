package com.aistudyhub.module.admin.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.admin.dto.UpdateUserActiveRequest;
import com.aistudyhub.module.admin.dto.UpdateUserRoleRequest;
import com.aistudyhub.module.user.dto.UserProfileResponse;
import com.aistudyhub.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.security.CustomUserDetails;

/**
 * Owner: BE1 – Admin user management
 * Base URL: /api/admin/users
 */
@Tag(name = "Admin – User Management", description = "Quản lý người dùng (ADMIN only)")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @Operation(summary = "Xem danh sách tất cả user (có tìm kiếm và phân trang)")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<UserProfileResponse>>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(direction, "createdAt").and(Sort.by(direction, "id")));
        Page<UserProfileResponse> result = userService.searchUsers(keyword, role, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(result)));
    }

    @Operation(summary = "Xem chi tiết user theo ID")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserDetail(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(userId)));
    }

    @Operation(summary = "Kích hoạt / vô hiệu hóa tài khoản user")
    @PatchMapping("/{userId}/active")
    public ResponseEntity<ApiResponse<UserProfileResponse>> toggleActive(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserActiveRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        UserProfileResponse response = userService.setUserActive(userId, request.getIsActive(), principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    @Operation(summary = "Thay đổi role hệ thống của user (STUDENT / ADMIN)")
    @PatchMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<UserProfileResponse>> changeRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request) {

        UserProfileResponse response = userService.changeUserRole(userId, request.getRole());
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
