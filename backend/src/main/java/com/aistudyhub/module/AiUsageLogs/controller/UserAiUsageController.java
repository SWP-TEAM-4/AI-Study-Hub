package com.aistudyhub.module.AiUsageLogs.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class UserAiUsageController {
    private final AiUsageService aiUsageService;

    @GetMapping("/ai-usage")
    public ApiResponse<UserAiUsageResponse> getMyUsage(@PathVariable Long userId) {
        return ApiResponse.success(aiUsageService.getMyUsage(userId));
    }

}
