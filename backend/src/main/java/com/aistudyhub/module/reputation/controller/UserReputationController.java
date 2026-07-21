package com.aistudyhub.module.reputation.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.reputation.dto.AiQuotaStatusResponse;
import com.aistudyhub.module.reputation.dto.ReputationEventResponse;
import com.aistudyhub.module.reputation.service.AiQuotaTierService;
import com.aistudyhub.module.reputation.service.ReputationService;
import com.aistudyhub.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User - Reputation", description = "User xem điểm uy tín và quota AI")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserReputationController {

    private final ReputationService reputationService;
    private final AiQuotaTierService aiQuotaTierService;
    private final UserService userService;

    @Operation(summary = "User xem ledger cộng/trừ điểm của mình")
    @GetMapping("/reputation/events")
    public ResponseEntity<ApiResponse<PaginationResponse<ReputationEventResponse>>> getMyReputationEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(
                reputationService.getUserEvents(userService.getCurrentUserId(), pageable))));
    }

    @Operation(summary = "User xem quota AI hiện tại theo điểm uy tín")
    @GetMapping("/ai-quota")
    public ResponseEntity<ApiResponse<AiQuotaStatusResponse>> getMyAiQuota() {
        return ResponseEntity.ok(ApiResponse.success(
                aiQuotaTierService.getQuotaStatus(userService.getCurrentUserId())));
    }
}
