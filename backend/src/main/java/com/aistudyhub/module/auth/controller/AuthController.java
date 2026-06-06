package com.aistudyhub.module.auth.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.auth.dto.*;
import com.aistudyhub.module.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Owner: BE1
 * Base URL: /api/auth
 */
@Tag(name = "Authentication", description = "Đăng ký, đăng nhập, quên/reset mật khẩu")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Đăng ký tài khoản mới")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @Operation(summary = "Đăng nhập – nhận JWT access token")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @Operation(summary = "Yêu cầu reset mật khẩu (gửi email mock)")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        // Luôn trả 200 để không tiết lộ email có tồn tại hay không
        return ResponseEntity.ok(
                ApiResponse.success("If the email exists, a reset link will be sent."));
    }

    @Operation(summary = "Reset mật khẩu bằng token nhận từ email")
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully."));
    }
}
