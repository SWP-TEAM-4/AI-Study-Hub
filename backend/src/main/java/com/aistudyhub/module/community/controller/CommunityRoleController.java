package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.community.dto.CommunityRoleResponse;
import com.aistudyhub.module.community.service.CommunityRoleService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Community Roles", description = "Xem community role hiện tại của user")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/community-roles")
@RequiredArgsConstructor
public class CommunityRoleController {

    private final CommunityRoleService communityRoleService;

    @Operation(summary = "Xem các community role hiện tại của bản thân")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<CommunityRoleResponse>>> getMyRoles(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(communityRoleService.getMyRoles(principal.getId())));
    }
}
