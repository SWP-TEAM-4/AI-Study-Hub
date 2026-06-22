package com.aistudyhub.module.systemconfig.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.systemconfig.dto.SystemConfigDeleteResponse;
import com.aistudyhub.module.systemconfig.dto.SystemConfigRequest;
import com.aistudyhub.module.systemconfig.dto.SystemConfigResponse;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Admin - System Config", description = "Admin quản lý system config")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/system-configs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemConfigController {

    private final SystemConfigService systemConfigService;

    @Operation(summary = "Admin xem danh sách system config")
    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> listConfigs() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.listAll()));
    }

    @Operation(summary = "Admin tạo system config mới")
    @PostMapping
    public ResponseEntity<ApiResponse<SystemConfigResponse>> createConfig(
            @Valid @RequestBody SystemConfigRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        SystemConfigResponse response = systemConfigService.create(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", response));
    }

    @Operation(summary = "Admin cập nhật system config")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateConfig(
            @PathVariable Long id,
            @Valid @RequestBody SystemConfigRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success("Success", systemConfigService.update(id, request, principal.getId())));
    }

    @Operation(summary = "Admin xóa system config")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<SystemConfigDeleteResponse>> deleteConfig(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        systemConfigService.delete(id, principal.getId());
        SystemConfigDeleteResponse response = SystemConfigDeleteResponse.builder()
                .deleted(true)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", response));
    }
}
