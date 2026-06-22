package com.aistudyhub.module.activitylog.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.activitylog.dto.ActivityLogResponse;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin - Activity Logs", description = "Audit log truy vết hành động quan trọng")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityLogController {

    private final ActivityLogService activityLogService;

    @Operation(summary = "Admin xem danh sách activity log toàn hệ thống")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<ActivityLogResponse>>> getActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort) {

        PaginationResponse<ActivityLogResponse> response = activityLogService.getAdminLogs(keyword, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
