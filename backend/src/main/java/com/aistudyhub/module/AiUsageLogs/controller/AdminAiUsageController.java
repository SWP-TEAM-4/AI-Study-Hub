package com.aistudyhub.module.AiUsageLogs.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.AiUsageLogs.dto.AdminAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAiUsageController {
    private final AiUsageService aiUsageService;

    @GetMapping("/analytics/ai-usage")
    public ApiResponse<AdminAiUsageResponse> getAllUsage() {
        return ApiResponse.success(aiUsageService.getAllUsage());
    }

}
