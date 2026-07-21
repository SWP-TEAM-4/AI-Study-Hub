package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.community.dto.CommunityProfileResponse;
import com.aistudyhub.module.community.service.CommunityProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Community Profile", description = "Public profile cho thành viên cộng đồng")
@RestController
@RequestMapping("/api/community/users")
@RequiredArgsConstructor
public class CommunityProfileController {

    private final CommunityProfileService communityProfileService;

    @Operation(summary = "Xem public profile của một thành viên cộng đồng")
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<CommunityProfileResponse>> getPublicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(communityProfileService.getPublicProfile(userId)));
    }
}
