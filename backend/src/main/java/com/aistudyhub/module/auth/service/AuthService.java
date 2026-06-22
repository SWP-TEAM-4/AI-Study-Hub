package com.aistudyhub.module.auth.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.utils.DateUtil;
import com.aistudyhub.entity.PasswordReset;
import com.aistudyhub.entity.Semester;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.auth.dto.*;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.ComboRepository;
import com.aistudyhub.repository.PasswordResetRepository;
import com.aistudyhub.repository.SemesterRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.UUID;

/**
 * Owner: BE1 – KHÔNG sửa mà không báo nhóm.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int DEFAULT_RESET_TOKEN_EXPIRE_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final SemesterRepository semesterRepository;
    private final ComboRepository comboRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final SystemConfigService systemConfigService;
    private final ActivityLogService activityLogService;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Check email trùng
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 2. Build entity
        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .isActive(true)
                .build();

        // 3. Gắn semester (optional)
        if (request.getCurrentSemesterId() != null) {
            Semester semester = semesterRepository.findById(request.getCurrentSemesterId())
                    .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND));
            user.setCurrentSemester(semester);
        }

        // 4. Gắn combo (optional)
        if (request.getComboId() != null) {
            var combo = comboRepository.findById(request.getComboId())
                    .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
            user.setCombo(combo);
        }

        user = userRepository.save(user);
        log.info("New user registered: id={}, email={}", user.getId(), user.getEmail());

        // 5. Gửi email chào mừng (async – không block)
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        // 6. Sinh token và trả về
        String token = jwtTokenProvider.generateToken(user.getId());
        return toAuthResponse(user, token);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // 1. Tìm user
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        // 2. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 3. Kiểm tra tài khoản active
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_INACTIVE);
        }

        log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());
        String token = jwtTokenProvider.generateToken(user.getId());
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("loginMethod", "PASSWORD");
        metadata.put("role", user.getRole().name());
        activityLogService.log(
                user.getId(),
                ActivityActionType.LOGIN,
                ActivityTargetType.USER,
                user.getId(),
                metadata,
                user.getEmail(),
                user.getFullName());
        return toAuthResponse(user, token);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElse(null);

        // Không tiết lộ email có tồn tại hay không (security best practice)
        if (user == null || Boolean.FALSE.equals(user.getIsActive())) {
            log.info("Forgot password requested for unknown/inactive email: {}", email);
            return;
        }

        // Xóa token cũ nếu có
        passwordResetRepository.deleteAllByUserId(user.getId());

        // Tạo token mới
        int expireMinutes = systemConfigService.getIntValueOrDefault(
                SystemConfigKeys.RESET_TOKEN_EXPIRE_MINUTES,
                DEFAULT_RESET_TOKEN_EXPIRE_MINUTES
        );
        String token = UUID.randomUUID().toString();
        PasswordReset reset = PasswordReset.builder()
                .user(user)
                .resetToken(token)
                .expiredAt(LocalDateTime.now().plusMinutes(expireMinutes))
                .build();
        passwordResetRepository.save(reset);

        // Gửi email reset password thật qua Gmail SMTP (async – không block)
        emailService.sendPasswordResetEmail(email, user.getFullName(), token, expireMinutes);
        log.info("Password reset email dispatched for userId={}", user.getId());
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Tìm token
        PasswordReset reset = passwordResetRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_RESET_TOKEN));

        // 2. Kiểm tra hết hạn
        if (DateUtil.isExpired(reset.getExpiredAt())) {
            passwordResetRepository.delete(reset);
            throw new AppException(ErrorCode.INVALID_RESET_TOKEN,
                    "Password reset token has expired. Please request a new one.");
        }

        // 3. Cập nhật password
        User user = reset.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. Xóa token đã dùng
        passwordResetRepository.delete(reset);
        log.info("Password reset successful for userId={}", user.getId());
    }

    // ── Private mapping ───────────────────────────────────────────────────────

    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .reputationPoints(user.getReputationPoints())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
