package com.aistudyhub.module.auth.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.auth.dto.*;
import com.aistudyhub.module.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    public record OAuthLoginRequest(
            @NotBlank(message = "OAuth authorization code is required")
            String code,
            String redirectUri) {
    }

    @Operation(summary = "Đăng ký tài khoản mới")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegistrationResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        RegistrationResponse response = authService.register(request, resolveClientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration pending. Please verify the code sent to your email.",
                        response));
    }

    @Operation(summary = "Xác thực mã đăng ký và kích hoạt tài khoản")
    @PostMapping("/verify-registration")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyRegistration(
            @Valid @RequestBody VerifyRegistrationRequest request) {
        AuthResponse response = authService.verifyRegistration(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", response));
    }

    @Operation(summary = "Gửi lại mã xác thực đăng ký")
    @PostMapping("/resend-verification-code")
    public ResponseEntity<ApiResponse<RegistrationResponse>> resendRegistrationVerification(
            @Valid @RequestBody ResendRegistrationVerificationRequest request) {
        RegistrationResponse response = authService.resendRegistrationVerification(request);
        return ResponseEntity.ok(ApiResponse.success("Verification code has been sent.", response));
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

    @Operation(summary = "Lấy Google OAuth authorization URL")
    @GetMapping("/oauth/google/authorize-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getGoogleAuthorizationUrl(
            @RequestParam(required = false) String redirectUri) {
        return ResponseEntity.ok(ApiResponse.success(
                "Google authorization URL generated",
                authService.buildGoogleAuthorizationUrl(redirectUri)));
    }

    @Operation(summary = "Login bằng Google authorization code")
    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(
            @Valid @RequestBody OAuthLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request.code(), request.redirectUri());
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    @Operation(summary = "Lấy GitHub OAuth authorization URL")
    @GetMapping("/oauth/github/authorize-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getGithubAuthorizationUrl(
            @RequestParam(required = false) String redirectUri) {
        return ResponseEntity.ok(ApiResponse.success(
                "GitHub authorization URL generated",
                authService.buildGithubAuthorizationUrl(redirectUri)));
    }

    @Operation(summary = "Login bằng GitHub authorization code")
    @PostMapping("/oauth/github")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGithub(
            @Valid @RequestBody OAuthLoginRequest request) {
        AuthResponse response = authService.loginWithGithub(request.code(), request.redirectUri());
        return ResponseEntity.ok(ApiResponse.success("GitHub login successful", response));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = firstIp(request.getHeader("X-Forwarded-For"));
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor;
        }

        String realIp = firstIp(request.getHeader("X-Real-IP"));
        if (StringUtils.hasText(realIp)) {
            return realIp;
        }

        String forwarded = request.getHeader("Forwarded");
        String forwardedIp = parseForwardedFor(forwarded);
        if (StringUtils.hasText(forwardedIp)) {
            return forwardedIp;
        }

        return normalizeIp(request.getRemoteAddr());
    }

    private String firstIp(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return null;
        }
        String candidate = rawValue.split(",")[0].trim();
        return normalizeIp(candidate);
    }

    private String parseForwardedFor(String forwardedHeader) {
        if (!StringUtils.hasText(forwardedHeader)) {
            return null;
        }
        for (String part : forwardedHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.toLowerCase().startsWith("for=")) {
                return normalizeIp(trimmed.substring(4));
            }
        }
        return null;
    }

    private String normalizeIp(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String ip = value.trim();
        if (!StringUtils.hasText(ip) || "unknown".equalsIgnoreCase(ip)) {
            return null;
        }
        if (ip.startsWith("\"") && ip.endsWith("\"") && ip.length() > 1) {
            ip = ip.substring(1, ip.length() - 1);
        }
        if (ip.startsWith("[") && ip.contains("]")) {
            ip = ip.substring(1, ip.indexOf(']'));
        } else {
            int lastColon = ip.lastIndexOf(':');
            if (lastColon > -1 && ip.indexOf(':') == lastColon && ip.contains(".")) {
                ip = ip.substring(0, lastColon);
            }
        }
        return ip.length() <= 45 ? ip : ip.substring(0, 45);
    }
}
