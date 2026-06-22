package com.aistudyhub.module.badge.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.badge.dto.BadgeRequest;
import com.aistudyhub.module.badge.dto.BadgeResponse;
import com.aistudyhub.module.badge.service.BadgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin - Badges", description = "Admin tạo badge và gán badge cho user")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBadgeController {

    private final BadgeService badgeService;

    @Operation(summary = "Admin tạo badge mới")
    @PostMapping("/badges")
    public ResponseEntity<ApiResponse<BadgeResponse>> createBadge(
            @Valid @RequestBody BadgeRequest request) {

        BadgeResponse response = badgeService.createBadge(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", response));
    }

    @Operation(summary = "Admin gán badge cho user")
    @PostMapping("/users/{userId}/badges/{badgeId}")
    public ResponseEntity<ApiResponse<BadgeResponse>> assignBadge(
            @PathVariable Long userId,
            @PathVariable Long badgeId) {

        return ResponseEntity.ok(ApiResponse.success("Success", badgeService.assignBadgeToUser(userId, badgeId)));
    }
}
