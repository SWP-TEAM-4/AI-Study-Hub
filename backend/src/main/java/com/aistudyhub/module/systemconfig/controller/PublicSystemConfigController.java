package com.aistudyhub.module.systemconfig.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.systemconfig.dto.SystemConfigResponse;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Public - System Config", description = "Public system configs for frontend and shared modules")
@RestController
@RequestMapping("/api/system-configs")
@RequiredArgsConstructor
public class PublicSystemConfigController {

    private final SystemConfigService systemConfigService;

    @Operation(summary = "Lấy danh sách public system config")
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> listPublicConfigs() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.listPublicConfigs()));
    }
}
