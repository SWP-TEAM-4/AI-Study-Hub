package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.document.dto.DocumentSafetyReviewDecisionRequest;
import com.aistudyhub.module.document.dto.DocumentSafetyReviewResponse;
import com.aistudyhub.module.document.dto.DocumentSafetySettingsResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentSafetySettingsRequest;
import com.aistudyhub.module.document.service.DocumentSafetyReviewService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin - Document Safety", description = "Admin review AI document safety moderation results")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/document-safety")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDocumentSafetyController {

    private final DocumentSafetyReviewService documentSafetyReviewService;

    @Operation(summary = "Get document safety moderation settings")
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<DocumentSafetySettingsResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(documentSafetyReviewService.getSettings()));
    }

    @Operation(summary = "Enable or disable document safety moderation")
    @PatchMapping("/settings")
    public ResponseEntity<ApiResponse<DocumentSafetySettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateDocumentSafetySettingsRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Document safety setting updated",
                documentSafetyReviewService.updateSettings(request, principal.getId())));
    }

    @Operation(summary = "List document safety review queue")
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PaginationResponse<DocumentSafetyReviewResponse>>> listReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort) {

        return ResponseEntity.ok(ApiResponse.success(documentSafetyReviewService.listReviews(
                status, severity, keyword, page, size, sort)));
    }

    @Operation(summary = "Admin approve a flagged document safety review")
    @PatchMapping("/reviews/{id}/approve")
    public ResponseEntity<ApiResponse<DocumentSafetyReviewResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) DocumentSafetyReviewDecisionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Document safety review approved",
                documentSafetyReviewService.approve(id, request, principal.getId())));
    }

    @Operation(summary = "Admin reject a flagged document safety review")
    @PatchMapping("/reviews/{id}/reject")
    public ResponseEntity<ApiResponse<DocumentSafetyReviewResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) DocumentSafetyReviewDecisionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Document safety review rejected",
                documentSafetyReviewService.reject(id, request, principal.getId())));
    }
}
