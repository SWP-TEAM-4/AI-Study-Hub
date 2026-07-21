package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.ContributorLeaderboardItemResponse;
import com.aistudyhub.module.community.service.ContributorLeaderboardService;
import com.aistudyhub.module.reputation.dto.ReputationLeaderboardItemResponse;
import com.aistudyhub.module.reputation.service.ReputationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.EnumSet;
import java.util.Set;

@Tag(name = "Community Growth", description = "Leaderboard cho contributor trong cộng đồng")
@RestController
@RequestMapping("/api/community/leaderboard")
@RequiredArgsConstructor
public class CommunityLeaderboardController {

    private static final Set<ReputationEventType> CONTRIBUTOR_EVENTS = EnumSet.of(
            ReputationEventType.CONTENT_APPROVED_DOCUMENT,
            ReputationEventType.CONTENT_APPROVED_QUIZ,
            ReputationEventType.CONTENT_APPROVED_FLASHCARD_DECK,
            ReputationEventType.MARKETPLACE_CLONE_RECEIVED,
            ReputationEventType.CONTENT_DOWNLOAD_MILESTONE,
            ReputationEventType.COMMUNITY_REVIEW_GOOD,
            ReputationEventType.COMMUNITY_REVIEW_BAD,
            ReputationEventType.CONTENT_REPORT_ACCEPTED,
            ReputationEventType.CONTENT_REPORT_REJECTED,
            ReputationEventType.CONTENT_REPORT_OWNER_PENALTY,
            ReputationEventType.CONTENT_HIDDEN_PENALTY);

    private static final Set<ReputationEventType> REVIEWER_EVENTS = EnumSet.of(
            ReputationEventType.REVIEWER_MARKETPLACE_VOTE,
            ReputationEventType.REVIEWER_DECISION_ALIGNED);

    private final ContributorLeaderboardService contributorLeaderboardService;
    private final ReputationService reputationService;

    @Operation(summary = "Lấy contributor leaderboard")
    @GetMapping("/contributors")
    public ResponseEntity<ApiResponse<PaginationResponse<ContributorLeaderboardItemResponse>>> getContributorLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                contributorLeaderboardService.getContributorLeaderboard(page, size)));
    }

    @Operation(summary = "Lấy leaderboard đóng góp theo môn và tháng")
    @GetMapping("/reputation/contributors")
    public ResponseEntity<ApiResponse<PaginationResponse<ReputationLeaderboardItemResponse>>> getSubjectContributorLeaderboard(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String periodKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(
                reputationService.getLeaderboard(subjectId, periodKey, CONTRIBUTOR_EVENTS, page, size))));
    }

    @Operation(summary = "Lấy leaderboard reviewer theo môn và tháng")
    @GetMapping("/reputation/reviewers")
    public ResponseEntity<ApiResponse<PaginationResponse<ReputationLeaderboardItemResponse>>> getSubjectReviewerLeaderboard(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String periodKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(
                reputationService.getLeaderboard(subjectId, periodKey, REVIEWER_EVENTS, page, size))));
    }
}
