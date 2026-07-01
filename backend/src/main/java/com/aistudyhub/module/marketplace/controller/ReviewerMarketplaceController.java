package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.marketplace.dto.MarketPendingItemResponse;
import com.aistudyhub.module.marketplace.dto.MarketReviewRequest;
import com.aistudyhub.module.marketplace.dto.MarketReviewResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceItemResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceQueryRequest;
import com.aistudyhub.module.marketplace.service.MarketReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * BE-046 reviewer queue endpoints and admin override actions.
 */
@Tag(name = "Reviewer Marketplace Queue", description = "Reviewer queue, vote và admin override cho marketplace")
@RestController
@Validated
@RequiredArgsConstructor
public class ReviewerMarketplaceController {

    private final MarketReviewService marketReviewService;

    @Operation(summary = "Lấy danh sách nội dung đang chờ duyệt")
    @PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
    @GetMapping("/api/reviewer/marketplace/pending")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketPendingItemResponse>>> getPendingQueue(
            @ParameterObject MarketplaceQueryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.getPendingQueue(request)));
    }

    @Operation(summary = "Admin lấy danh sách nội dung đang chờ duyệt")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/marketplace/pending")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketPendingItemResponse>>> getAdminPendingQueue(
            @ParameterObject MarketplaceQueryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.getPendingQueue(request)));
    }

    @Operation(summary = "Xem chi tiết nội dung marketplace trước khi vote")
    @PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
    @GetMapping("/api/reviewer/marketplace/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<MarketplaceItemResponse>> getItemDetail(
            @PathVariable String targetType,
            @PathVariable Long targetId) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.getItemDetail(targetType, targetId)));
    }

    @Operation(summary = "Reviewer vote ACCEPT hoặc REJECT cho nội dung marketplace")
    @PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
    @PostMapping("/api/reviewer/marketplace/{targetType}/{targetId}/vote")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> vote(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody MarketReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.vote(targetType, targetId, request)));
    }

    @Operation(summary = "Admin approve thủ công nội dung marketplace")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/marketplace/{targetType}/{targetId}/approve")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> adminApprove(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @RequestBody(required = false) MarketReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.adminApprove(targetType, targetId,
                request != null ? request.getReviewNote() : null)));
    }

    @Operation(summary = "Admin reject thủ công nội dung marketplace")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/marketplace/{targetType}/{targetId}/reject")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> adminReject(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @RequestBody(required = false) MarketReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(marketReviewService.adminReject(targetType, targetId,
                request != null ? request.getReviewNote() : null)));
    }
}
