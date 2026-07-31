package com.aistudyhub.module.governance.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.governance.dto.AdminGovernanceItemResponse;
import com.aistudyhub.module.governance.dto.AdminGovernanceModerationRequest;
import com.aistudyhub.module.governance.dto.AdminGovernancePreviewResponse;
import com.aistudyhub.module.governance.service.AdminContentGovernanceService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin Content Governance", description = "Admin preview governance cho document/quiz/flashcard/notebook chat")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/governance")
@RequiredArgsConstructor
public class AdminContentGovernanceController {

    private final AdminContentGovernanceService adminContentGovernanceService;

    @Operation(summary = "Admin xem danh sách tài liệu để kiểm tra nội dung")
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminGovernanceItemResponse>>> listDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String keyword) {

        return ResponseEntity.ok(ApiResponse.success(
                adminContentGovernanceService.listDocuments(keyword, page, size)));
    }

    @Operation(summary = "Admin xem danh sách quiz để kiểm tra nội dung")
    @GetMapping("/quizzes")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminGovernanceItemResponse>>> listQuizzes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String keyword) {

        return ResponseEntity.ok(ApiResponse.success(
                adminContentGovernanceService.listQuizzes(keyword, page, size)));
    }

    @Operation(summary = "Admin xem danh sách flashcard deck để kiểm tra nội dung")
    @GetMapping("/flashcards")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminGovernanceItemResponse>>> listFlashcards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String keyword) {

        return ResponseEntity.ok(ApiResponse.success(
                adminContentGovernanceService.listFlashcards(keyword, page, size)));
    }

    @Operation(summary = "Admin xem metadata các phiên chat notebook")
    @GetMapping("/chat-sessions")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminGovernanceItemResponse>>> listChatSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String keyword) {

        return ResponseEntity.ok(ApiResponse.success(
                adminContentGovernanceService.listChatSessions(keyword, page, size)));
    }

    @Operation(summary = "Admin preview nội dung theo target type")
    @GetMapping("/{targetType}/{targetId}/preview")
    public ResponseEntity<ApiResponse<AdminGovernancePreviewResponse>> previewContent(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        AdminGovernancePreviewResponse response = adminContentGovernanceService.previewContent(
                targetType,
                targetId,
                principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Governance preview loaded successfully", response));
    }

    @Operation(summary = "Admin gửi cảnh báo tới chủ sở hữu nội dung")
    @PostMapping("/{targetType}/{targetId}/warn-owner")
    public ResponseEntity<ApiResponse<AdminGovernanceItemResponse>> warnOwner(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody AdminGovernanceModerationRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        AdminGovernanceItemResponse response = adminContentGovernanceService.warnOwner(
                targetType,
                targetId,
                principal.getId(),
                request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Owner warning sent successfully", response));
    }
}
