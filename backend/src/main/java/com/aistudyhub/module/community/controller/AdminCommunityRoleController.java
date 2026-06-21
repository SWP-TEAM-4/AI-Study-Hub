package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.CommunityRoleResponse;
import com.aistudyhub.module.community.dto.CreateCommunityRoleRequest;
import com.aistudyhub.module.community.dto.RevokeCommunityRoleRequest;
import com.aistudyhub.module.community.service.CommunityRoleService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Community Roles", description = "Quản lý community role theo scope")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/community-roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommunityRoleController {

    private final CommunityRoleService communityRoleService;

    @Operation(summary = "Admin cấp community role cho user")
    @PostMapping
    public ResponseEntity<ApiResponse<CommunityRoleResponse>> createRole(
            @Valid @RequestBody CreateCommunityRoleRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        CommunityRoleResponse response = communityRoleService.grantRole(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", response));
    }

    @Operation(summary = "Admin xem danh sách community role")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<CommunityRoleResponse>>> listRoles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String roleType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String scopeType,
            @RequestParam(required = false) Long scopeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        PaginationResponse<CommunityRoleResponse> response = communityRoleService.searchRoles(
                keyword, userId, roleType, status, scopeType, scopeId, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Admin thu hồi community role")
    @PatchMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<CommunityRoleResponse>> revokeRole(
            @PathVariable Long id,
            @RequestBody(required = false) RevokeCommunityRoleRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        CommunityRoleResponse response = communityRoleService.revokeRole(
                id,
                principal.getId(),
                request != null ? request.getReason() : null);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
