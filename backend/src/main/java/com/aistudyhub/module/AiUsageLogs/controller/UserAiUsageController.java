package com.aistudyhub.module.AiUsageLogs.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.AiUsageLogs.dto.UserAiUsageResponse;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;
import com.aistudyhub.module.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class UserAiUsageController {
    private final AiUsageService aiUsageService;
    private final UserService userService;

    @GetMapping("/ai-usage")
    public ApiResponse<UserAiUsageResponse> getMyUsage() {
        return ApiResponse.success(aiUsageService.getMyUsage(userService.getCurrentUserId()));
    }

}
