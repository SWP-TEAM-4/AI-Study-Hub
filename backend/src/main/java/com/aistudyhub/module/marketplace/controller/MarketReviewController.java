package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.marketplace.dto.*;
import com.aistudyhub.module.marketplace.service.MarketReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller exposing endpoints for marketplace review management.
 * Owner: BE3 (Task BE-030)
 */
@Tag(name = "Admin/Reviewer - Marketplace Review", description = "Admin và Reviewer duyệt nội dung marketplace")
@RestController
@RequestMapping("/api/admin/marketplace")
@RequiredArgsConstructor
@Validated
public class MarketReviewController {

    private final MarketReviewService marketReviewService;

    /**
     * Retrieve the list of resources pending review.
     */
    @Operation(summary = "Admin lấy danh sách nội dung marketplace đang chờ duyệt")
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketPendingItemResponse>>> getPendingQueue(
            @ParameterObject MarketplaceQueryRequest request) {
        PaginationResponse<MarketPendingItemResponse> response = marketReviewService.getPendingQueue(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Review a pending document.
     */
    @Operation(summary = "Admin duyệt hoặc từ chối tài liệu marketplace")
    @PostMapping("/documents/{id}/review")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> reviewDocument(
            @PathVariable Long id,
            @Valid @RequestBody MarketReviewRequest request) {
        MarketReviewResponse response = marketReviewService.reviewDocument(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Review a pending quiz.
     */
    @Operation(summary = "Admin duyệt hoặc từ chối quiz marketplace")
    @PostMapping("/quizzes/{id}/review")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> reviewQuiz(
            @PathVariable Long id,
            @Valid @RequestBody MarketReviewRequest request) {
        MarketReviewResponse response = marketReviewService.reviewQuiz(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Review a pending flashcard deck.
     */
    @Operation(summary = "Admin duyệt hoặc từ chối bộ flashcard marketplace")
    @PostMapping("/flashcard-decks/{id}/review")
    public ResponseEntity<ApiResponse<MarketReviewResponse>> reviewFlashcardDeck(
            @PathVariable Long id,
            @Valid @RequestBody MarketReviewRequest request) {
        MarketReviewResponse response = marketReviewService.reviewFlashcardDeck(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
