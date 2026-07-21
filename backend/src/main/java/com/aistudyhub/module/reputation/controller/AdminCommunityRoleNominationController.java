package com.aistudyhub.module.reputation.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.reputation.dto.CommunityRoleNominationResponse;
import com.aistudyhub.module.reputation.dto.CreateReviewerNominationRequest;
import com.aistudyhub.module.reputation.dto.ReviewNominationRequest;
import com.aistudyhub.module.reputation.service.CommunityRoleNominationService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Admin - Community Role Nominations", description = "Admin duyệt đề cử reviewer/moderator")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/community-role-nominations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommunityRoleNominationController {

    private final CommunityRoleNominationService nominationService;

    @Operation(summary = "Admin tạo đề cử monthly top contributor/reviewer unlock cho một kỳ")
    @PostMapping("/generate-monthly")
    public ResponseEntity<ApiResponse<List<CommunityRoleNominationResponse>>> generateMonthly(
            @RequestParam(required = false) String periodKey) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", nominationService.generateMonthlyNominations(periodKey)));
    }

    @Operation(summary = "Admin tạo đề cử reviewer thủ công cho một môn")
    @PostMapping("/reviewers")
    public ResponseEntity<ApiResponse<CommunityRoleNominationResponse>> nominateReviewer(
            @Valid @RequestBody CreateReviewerNominationRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", nominationService.nominateReviewer(
                        request.getUserId(),
                        request.getSubjectId(),
                        request.getReason())));
    }

    @Operation(summary = "Admin xem/filter danh sách đề cử")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<CommunityRoleNominationResponse>>> listNominations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String nominationType,
            @RequestParam(required = false) String roleType,
            @RequestParam(required = false) String periodKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        return ResponseEntity.ok(ApiResponse.success(nominationService.search(
                userId, subjectId, status, nominationType, roleType, periodKey, page, size, sort)));
    }

    @Operation(summary = "Admin duyệt đề cử và cấp community role")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<CommunityRoleNominationResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewNominationRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(
                "Success",
                nominationService.approve(id, request, principal.getId())));
    }

    @Operation(summary = "Admin từ chối đề cử")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<CommunityRoleNominationResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewNominationRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(
                "Success",
                nominationService.reject(id, request, principal.getId())));
    }
}
