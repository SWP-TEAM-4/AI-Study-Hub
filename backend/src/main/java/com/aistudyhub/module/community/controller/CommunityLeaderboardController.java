package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.ContributorLeaderboardItemResponse;
import com.aistudyhub.module.community.service.ContributorLeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Community Growth", description = "Leaderboard cho contributor trong cộng đồng")
@RestController
@RequestMapping("/api/community/leaderboard")
@RequiredArgsConstructor
public class CommunityLeaderboardController {

    private final ContributorLeaderboardService contributorLeaderboardService;

    @Operation(summary = "Lấy contributor leaderboard")
    @GetMapping("/contributors")
    public ResponseEntity<ApiResponse<PaginationResponse<ContributorLeaderboardItemResponse>>> getContributorLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                contributorLeaderboardService.getContributorLeaderboard(page, size)));
    }
}
