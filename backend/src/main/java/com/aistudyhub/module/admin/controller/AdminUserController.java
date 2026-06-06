package com.aistudyhub.module.admin.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.user.dto.UserProfileResponse;
import com.aistudyhub.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserProfileResponse> result = userService.searchUsers(keyword, pageable);
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
    public ResponseEntity<ApiResponse<Void>> toggleActive(
            @PathVariable Long userId,
            @RequestParam boolean active) {
        userService.setUserActive(userId, active, userService.getCurrentUserId());
        String msg = active ? "User activated" : "User deactivated";
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @Operation(summary = "Thay đổi role hệ thống của user (STUDENT / ADMIN / REVIEWER)")
    @PatchMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(
            @PathVariable Long userId,
            @RequestParam String role) {
        userService.changeUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success("User role updated to " + role));
    }
}
