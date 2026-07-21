package com.aistudyhub.module.reputation.controller;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.reputation.dto.RewardRuleRequest;
import com.aistudyhub.module.reputation.dto.RewardRuleResponse;
import com.aistudyhub.module.reputation.service.ReputationService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Admin - Reward Rules", description = "Admin cấu hình cơ chế cộng/trừ điểm")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/reward-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRewardRuleController {

    private final ReputationService reputationService;

    @Operation(summary = "Admin xem toàn bộ reward rules")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RewardRuleResponse>>> listRules() {
        return ResponseEntity.ok(ApiResponse.success(reputationService.getRules()));
    }

    @Operation(summary = "Admin cập nhật reward rule theo event type")
    @PutMapping("/{eventType}")
    public ResponseEntity<ApiResponse<RewardRuleResponse>> updateRule(
            @PathVariable ReputationEventType eventType,
            @Valid @RequestBody RewardRuleRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(
                "Success",
                reputationService.updateRule(eventType, request, principal.getId())));
    }
}
