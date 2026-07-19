package com.aistudyhub.module.AiUsageLogs.controller;

import java.time.LocalDate;
import java.util.Locale;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
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
    public ApiResponse<UserAiUsageResponse> getMyUsage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String actionType) {
        return ApiResponse.success(aiUsageService.getMyUsage(
                userService.getCurrentUserId(),
                from,
                to,
                parseActionType(actionType)));
    }

    private AiActionType parseActionType(String rawActionType) {
        if (rawActionType == null || rawActionType.isBlank()) {
            return null;
        }
        try {
            return AiActionType.valueOf(rawActionType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid actionType value: " + rawActionType);
        }
    }

}
