package com.aistudyhub.module.feedback.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.feedback.dto.CreateSystemFeedbackRequest;
import com.aistudyhub.module.feedback.dto.SystemFeedbackResponse;
import com.aistudyhub.module.feedback.service.SystemFeedbackService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "System Feedback", description = "Người dùng gửi feedback cho hệ thống")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final SystemFeedbackService systemFeedbackService;

    @Operation(summary = "Gửi feedback hệ thống")
    @PostMapping
    public ResponseEntity<ApiResponse<SystemFeedbackResponse>> submitFeedback(
            @Valid @RequestBody CreateSystemFeedbackRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        SystemFeedbackResponse response = systemFeedbackService.submitFeedback(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", response));
    }
}
