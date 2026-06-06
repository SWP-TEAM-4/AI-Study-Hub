package com.aistudyhub.module.admin.controller;

import com.aistudyhub.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Public health check endpoint
 */
@Tag(name = "Health", description = "Server health check")
@RestController
@RequestMapping("/api")
public class HealthController {

    @Operation(summary = "Health check – kiểm tra server đang chạy")
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.success(Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now().toString(),
                "service", "AI Study Hub Backend"));
    }
}
