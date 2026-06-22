package com.aistudyhub.module.activitylog.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.activitylog.dto.ActivityLogResponse;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User - Activity Logs", description = "Xem activity log của chính mình")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/users/me/activity-logs")
@RequiredArgsConstructor
public class UserActivityLogController {

    private final ActivityLogService activityLogService;

    @Operation(summary = "User xem activity log của bản thân")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<ActivityLogResponse>>> getMyActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort,
            @AuthenticationPrincipal CustomUserDetails principal) {

        PaginationResponse<ActivityLogResponse> response =
                activityLogService.getMyLogs(principal.getId(), keyword, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
