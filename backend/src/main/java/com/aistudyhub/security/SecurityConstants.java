package com.aistudyhub.security;

/**
 * Owner: BE1
 * Hằng số bảo mật dùng chung – KHÔNG hard-code ở nơi khác.
 */
public final class SecurityConstants {

    private SecurityConstants() {
    }

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final int TOKEN_PREFIX_LEN = TOKEN_PREFIX.length();

    /** Các path được phép truy cập mà không cần JWT */
    public static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/health",
            "/api/system-configs/public",
            "/api/share/documents/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/v3/api-docs",
            "/files/**"
    };
}
