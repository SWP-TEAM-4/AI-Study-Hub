package com.aistudyhub.module.reputation.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.reputation.dto.AiQuotaTierRequest;
import com.aistudyhub.module.reputation.dto.AiQuotaTierResponse;
import com.aistudyhub.module.reputation.service.AiQuotaTierService;
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

@Tag(name = "Admin - AI Quota Tiers", description = "Admin cấu hình quota AI theo điểm uy tín")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/ai-quota-tiers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiQuotaTierController {

    private final AiQuotaTierService aiQuotaTierService;

    @Operation(summary = "Admin xem danh sách quota tiers")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AiQuotaTierResponse>>> listTiers() {
        return ResponseEntity.ok(ApiResponse.success(aiQuotaTierService.listTiers()));
    }

    @Operation(summary = "Admin tạo quota tier")
    @PostMapping
    public ResponseEntity<ApiResponse<AiQuotaTierResponse>> createTier(
            @Valid @RequestBody AiQuotaTierRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", aiQuotaTierService.createTier(request, principal.getId())));
    }

    @Operation(summary = "Admin cập nhật quota tier")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AiQuotaTierResponse>> updateTier(
            @PathVariable Long id,
            @Valid @RequestBody AiQuotaTierRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(
                "Success",
                aiQuotaTierService.updateTier(id, request, principal.getId())));
    }

    @Operation(summary = "Admin xóa quota tier")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTier(@PathVariable Long id) {
        aiQuotaTierService.deleteTier(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully"));
    }
}
