package com.aistudyhub.module.badge.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.badge.dto.BadgeResponse;
import com.aistudyhub.module.badge.service.BadgeService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Badges", description = "Xem danh sách badge và badge của người dùng hiện tại")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @Operation(summary = "Xem danh sách tất cả badge")
    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getAllBadges() {
        return ResponseEntity.ok(ApiResponse.success(badgeService.getAllBadges()));
    }

    @Operation(summary = "Xem danh sách badge của chính mình")
    @GetMapping("/users/me/badges")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getMyBadges(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(badgeService.getUserBadges(principal.getId())));
    }

    @Operation(summary = "Xem danh sách badge công khai của một người dùng")
    @GetMapping("/users/{userId}/badges")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getUserBadges(
            @PathVariable Long userId) {

        return ResponseEntity.ok(ApiResponse.success(badgeService.getUserBadges(userId)));
    }
}
