package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.marketplace.dto.ReviewPolicyResponse;
import com.aistudyhub.module.marketplace.dto.UpdateReviewPolicyRequest;
import com.aistudyhub.module.marketplace.service.ReviewPolicyService;
import com.aistudyhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/marketplace/review-policies")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReviewPolicyController {
    private final ReviewPolicyService service;

    @GetMapping("/{subjectId}")
    public ResponseEntity<ApiResponse<ReviewPolicyResponse>> get(@PathVariable Long subjectId) {
        return ResponseEntity.ok(ApiResponse.success(service.resolve(subjectId)));
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<ApiResponse<ReviewPolicyResponse>> update(@PathVariable Long subjectId,
            @Valid @RequestBody UpdateReviewPolicyRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(service.update(subjectId, request, principal.getId())));
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long subjectId) {
        service.delete(subjectId);
        return ResponseEntity.ok(ApiResponse.success("Review policy reset to system default"));
    }
}
