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
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Owner: BE1 – KHÔNG sửa mà không báo nhóm.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int DEFAULT_RESET_TOKEN_EXPIRE_MINUTES = 30;
    private static final String PROVIDER_PASSWORD = "PASSWORD";
    private static final String PROVIDER_GOOGLE = "GOOGLE";
    private static final String PROVIDER_GITHUB = "GITHUB";
    private static final String APPLICATION_USER_AGENT = "AI-Study-Hub";

    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final SemesterRepository semesterRepository;
    private final ComboRepository comboRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final SystemConfigService systemConfigService;
    private final ActivityLogService activityLogService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    @Value("${app.oauth.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.oauth.google.redirect-uri:http://localhost:5173/oauth/google/callback}")
    private String googleRedirectUri;

    @Value("${app.oauth.google.auth-uri:https://accounts.google.com/o/oauth2/v2/auth}")
    private String googleAuthUri;

    @Value("${app.oauth.google.token-uri:https://oauth2.googleapis.com/token}")
    private String googleTokenUri;

    @Value("${app.oauth.google.user-info-uri:https://openidconnect.googleapis.com/v1/userinfo}")
    private String googleUserInfoUri;

    @Value("${app.oauth.google.scope:openid email profile}")
    private String googleScope;

    @Value("${app.oauth.github.client-id:}")
    private String githubClientId;

    @Value("${app.oauth.github.client-secret:}")
    private String githubClientSecret;

    @Value("${app.oauth.github.redirect-uri:http://localhost:5173/oauth/github/callback}")
    private String githubRedirectUri;

    @Value("${app.oauth.github.auth-uri:https://github.com/login/oauth/authorize}")
    private String githubAuthUri;

    @Value("${app.oauth.github.token-uri:https://github.com/login/oauth/access_token}")
    private String githubTokenUri;

    @Value("${app.oauth.github.user-info-uri:https://api.github.com/user}")
    private String githubUserInfoUri;

    @Value("${app.oauth.github.email-uri:https://api.github.com/user/emails}")
    private String githubEmailUri;

    @Value("${app.oauth.github.scope:read:user user:email}")
    private String githubScope;

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
                .type(PROVIDER_PASSWORD)
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
        if (!StringUtils.hasText(user.getPasswordHash()) ||
                !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
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

    // ── OAuth Login: Google / GitHub ─────────────────────────────────────────

    public Map<String, String> buildGoogleAuthorizationUrl(String redirectUri) {
        assertOAuthConfigured(PROVIDER_GOOGLE, googleClientId, googleClientSecret);
        return buildAuthorizationUrl(
                googleAuthUri,
                googleClientId,
                normalizeRedirectUri(redirectUri, googleRedirectUri),
                googleScope,
                PROVIDER_GOOGLE);
    }

    public Map<String, String> buildGithubAuthorizationUrl(String redirectUri) {
        assertOAuthConfigured(PROVIDER_GITHUB, githubClientId, githubClientSecret);
        return buildAuthorizationUrl(
                githubAuthUri,
                githubClientId,
                normalizeRedirectUri(redirectUri, githubRedirectUri),
                githubScope,
                PROVIDER_GITHUB);
    }

    public AuthResponse loginWithGoogle(String code, String redirectUri) {
        assertOAuthConfigured(PROVIDER_GOOGLE, googleClientId, googleClientSecret);
        String accessToken = exchangeGoogleCodeForAccessToken(code, normalizeRedirectUri(redirectUri, googleRedirectUri));
        JsonNode profile = fetchGoogleProfile(accessToken);

        String providerUserId = requiredField(profile, "sub", PROVIDER_GOOGLE);
        String email = requiredVerifiedGoogleEmail(profile);
        String fullName = fieldText(profile, "name");
        String avatarUrl = fieldText(profile, "picture");

        User user = upsertOAuthUser(PROVIDER_GOOGLE, providerUserId, email, fullName, avatarUrl);
        logOAuthLogin(user, PROVIDER_GOOGLE);
        String token = jwtTokenProvider.generateToken(user.getId());
        return toAuthResponse(user, token);
    }

    public AuthResponse loginWithGithub(String code, String redirectUri) {
        assertOAuthConfigured(PROVIDER_GITHUB, githubClientId, githubClientSecret);
        String accessToken = exchangeGithubCodeForAccessToken(code, normalizeRedirectUri(redirectUri, githubRedirectUri));
        JsonNode profile = fetchGithubProfile(accessToken);

        String providerUserId = requiredField(profile, "id", PROVIDER_GITHUB);
        String email = requiredGithubVerifiedEmail(accessToken);
        String fullName = firstText(fieldText(profile, "name"), fieldText(profile, "login"));
        String avatarUrl = fieldText(profile, "avatar_url");

        User user = upsertOAuthUser(PROVIDER_GITHUB, providerUserId, email, fullName, avatarUrl);
        logOAuthLogin(user, PROVIDER_GITHUB);
        String token = jwtTokenProvider.generateToken(user.getId());
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

    private Map<String, String> buildAuthorizationUrl(String authUri,
                                                      String clientId,
                                                      String redirectUri,
                                                      String scope,
                                                      String provider) {
        String state = UUID.randomUUID().toString();
        String authorizationUrl = UriComponentsBuilder.fromUriString(authUri)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", scope)
                .queryParam("state", state)
                .queryParamIfPresent("prompt", PROVIDER_GOOGLE.equals(provider)
                        ? java.util.Optional.of("select_account")
                        : java.util.Optional.empty())
                .queryParamIfPresent("allow_signup", PROVIDER_GITHUB.equals(provider)
                        ? java.util.Optional.of("true")
                        : java.util.Optional.empty())
                .encode()
                .toUriString();

        LinkedHashMap<String, String> response = new LinkedHashMap<>();
        response.put("authorizationUrl", authorizationUrl);
        response.put("state", state);
        response.put("provider", provider.toLowerCase());
        response.put("redirectUri", redirectUri);
        return response;
    }

    private String exchangeGoogleCodeForAccessToken(String code, String redirectUri) {
        try {
            JsonNode response = webClient().post()
                    .uri(googleTokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromFormData("code", code)
                            .with("client_id", googleClientId)
                            .with("client_secret", googleClientSecret)
                            .with("redirect_uri", redirectUri)
                            .with("grant_type", "authorization_code"))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            return requiredField(response, "access_token", PROVIDER_GOOGLE);
        } catch (WebClientResponseException e) {
            log.warn("[OAuth] Google token exchange failed: status={}", e.getStatusCode());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Google OAuth login failed");
        } catch (Exception e) {
            log.warn("[OAuth] Google token exchange error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Google OAuth login failed");
        }
    }

    private String exchangeGithubCodeForAccessToken(String code, String redirectUri) {
        try {
            JsonNode response = webClient().post()
                    .uri(githubTokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.USER_AGENT, APPLICATION_USER_AGENT)
                    .body(BodyInserters.fromFormData("code", code)
                            .with("client_id", githubClientId)
                            .with("client_secret", githubClientSecret)
                            .with("redirect_uri", redirectUri))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            return requiredField(response, "access_token", PROVIDER_GITHUB);
        } catch (WebClientResponseException e) {
            log.warn("[OAuth] GitHub token exchange failed: status={}", e.getStatusCode());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub OAuth login failed");
        } catch (Exception e) {
            log.warn("[OAuth] GitHub token exchange error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub OAuth login failed");
        }
    }

    private JsonNode fetchGoogleProfile(String accessToken) {
        try {
            return webClient().get()
                    .uri(googleUserInfoUri)
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.warn("[OAuth] Google profile fetch failed: status={}", e.getStatusCode());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Google OAuth profile is invalid");
        } catch (Exception e) {
            log.warn("[OAuth] Google profile fetch error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Google OAuth profile is invalid");
        }
    }

    private JsonNode fetchGithubProfile(String accessToken) {
        try {
            return githubGet(accessToken, githubUserInfoUri);
        } catch (WebClientResponseException e) {
            log.warn("[OAuth] GitHub profile fetch failed: status={}", e.getStatusCode());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub OAuth profile is invalid");
        } catch (Exception e) {
            log.warn("[OAuth] GitHub profile fetch error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub OAuth profile is invalid");
        }
    }

    private String requiredGithubVerifiedEmail(String accessToken) {
        try {
            JsonNode emails = githubGet(accessToken, githubEmailUri);
            String fallbackVerifiedEmail = null;

            if (emails != null && emails.isArray()) {
                for (JsonNode emailNode : emails) {
                    String email = fieldText(emailNode, "email");
                    boolean verified = booleanField(emailNode, "verified");
                    if (!StringUtils.hasText(email) || !verified) {
                        continue;
                    }
                    if (booleanField(emailNode, "primary")) {
                        return normalizeEmail(email);
                    }
                    if (fallbackVerifiedEmail == null) {
                        fallbackVerifiedEmail = normalizeEmail(email);
                    }
                }
            }

            if (fallbackVerifiedEmail != null) {
                return fallbackVerifiedEmail;
            }
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub account must have a verified email");
        } catch (AppException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.warn("[OAuth] GitHub email fetch failed: status={}", e.getStatusCode());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub account email is invalid");
        } catch (Exception e) {
            log.warn("[OAuth] GitHub email fetch error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "GitHub account email is invalid");
        }
    }

    private JsonNode githubGet(String accessToken, String uri) {
        return webClient().get()
                .uri(uri)
                .headers(headers -> headers.setBearerAuth(accessToken))
                .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .header(HttpHeaders.USER_AGENT, APPLICATION_USER_AGENT)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
    }

    private User upsertOAuthUser(String provider,
                                 String providerUserId,
                                 String email,
                                 String fullName,
                                 String avatarUrl) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByGoogleIdAndType(providerUserId, provider)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseGet(() -> User.builder()
                        .email(normalizedEmail)
                        .fullName(fallbackDisplayName(fullName, normalizedEmail))
                        .avatarUrl(avatarUrl)
                        .googleId(providerUserId)
                        .type(provider)
                        .isActive(true)
                        .build());

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_INACTIVE);
        }

        if (!StringUtils.hasText(user.getGoogleId()) || provider.equalsIgnoreCase(String.valueOf(user.getType()))) {
            user.setGoogleId(providerUserId);
            user.setType(provider);
        }
        if (StringUtils.hasText(fullName)) {
            user.setFullName(fullName.trim());
        }
        if (StringUtils.hasText(avatarUrl)) {
            user.setAvatarUrl(avatarUrl.trim());
        }

        User saved = userRepository.save(user);
        log.info("[OAuth] {} login resolved userId={} email={}", provider, saved.getId(), saved.getEmail());
        return saved;
    }

    private void logOAuthLogin(User user, String provider) {
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("loginMethod", provider);
        metadata.put("role", user.getRole().name());
        activityLogService.log(
                user.getId(),
                ActivityActionType.LOGIN,
                ActivityTargetType.USER,
                user.getId(),
                metadata,
                user.getEmail(),
                user.getFullName());
    }

    private String requiredVerifiedGoogleEmail(JsonNode profile) {
        String email = requiredField(profile, "email", PROVIDER_GOOGLE);
        if (!booleanField(profile, "email_verified")) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Google account email is not verified");
        }
        return normalizeEmail(email);
    }

    private String requiredField(JsonNode node, String field, String provider) {
        String value = fieldText(node, field);
        if (!StringUtils.hasText(value)) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS,
                    provider + " OAuth response is missing " + field);
        }
        return value;
    }

    private String fieldText(JsonNode node, String field) {
        if (node == null || !node.hasNonNull(field)) {
            return null;
        }
        String value = node.get(field).asText();
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean booleanField(JsonNode node, String field) {
        return node != null && node.hasNonNull(field) && node.get(field).asBoolean(false);
    }

    private String firstText(String primary, String fallback) {
        return StringUtils.hasText(primary) ? primary : fallback;
    }

    private String fallbackDisplayName(String fullName, String email) {
        if (StringUtils.hasText(fullName)) {
            return fullName.trim();
        }
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "OAuth account email is missing");
        }
        return email.toLowerCase().trim();
    }

    private String normalizeRedirectUri(String requestedRedirectUri, String configuredRedirectUri) {
        return StringUtils.hasText(requestedRedirectUri)
                ? requestedRedirectUri.trim()
                : configuredRedirectUri;
    }

    private void assertOAuthConfigured(String provider, String clientId, String clientSecret) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, provider + " OAuth is not configured");
        }
    }

    private WebClient webClient() {
        return webClientBuilder.build();
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
                .currentSemesterId(user.getCurrentSemester() != null ? user.getCurrentSemester().getId() : null)
                .currentSemesterCode(user.getCurrentSemester() != null ? user.getCurrentSemester().getCode() : null)
                .currentSemesterName(user.getCurrentSemester() != null ? user.getCurrentSemester().getName() : null)
                .comboId(user.getCombo() != null ? user.getCombo().getId() : null)
                .comboCode(user.getCombo() != null ? user.getCombo().getCode() : null)
                .comboName(user.getCombo() != null ? user.getCombo().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
