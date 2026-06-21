package com.aistudyhub.module.feedback.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.feedback.dto.SystemFeedbackResponse;
import com.aistudyhub.module.feedback.dto.UpdateSystemFeedbackStatusRequest;
import com.aistudyhub.module.feedback.service.SystemFeedbackService;
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

@Tag(name = "Admin - System Feedback", description = "Admin quản lý feedback hệ thống")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeedbackController {

    private final SystemFeedbackService systemFeedbackService;

    @Operation(summary = "Admin xem danh sách feedback")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<SystemFeedbackResponse>>> listFeedbacks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        PaginationResponse<SystemFeedbackResponse> response = systemFeedbackService.searchFeedbacks(
                keyword,
                status,
                page,
                size,
                sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Admin cập nhật trạng thái feedback")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SystemFeedbackResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSystemFeedbackStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        SystemFeedbackResponse response = systemFeedbackService.updateStatus(id, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
