package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.community.dto.ApplyReferralRequest;
import com.aistudyhub.module.community.dto.ReferralResponse;
import com.aistudyhub.module.community.service.ReferralService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Community Growth", description = "Referral code và contributor leaderboard")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    @Operation(summary = "Xem referral code và trạng thái áp dụng mã của bản thân")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ReferralResponse>> getMyReferral(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(referralService.getMyReferral(principal.getId())));
    }

    @Operation(summary = "Áp dụng referral code của người khác")
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<ReferralResponse>> applyReferral(
            @Valid @RequestBody ApplyReferralRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(referralService.applyReferral(principal.getId(), request)));
    }
}
