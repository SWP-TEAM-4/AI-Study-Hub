package com.aistudyhub.config;

import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.security.JwtAuthenticationFilter;
import com.aistudyhub.security.SecurityConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

/**
 * Owner: BE1 – KHÔNG sửa file này mà không báo nhóm.
 * <p>
 * Cấu hình Spring Security 6:
 * - Stateless session (JWT)
 * - Cho phép public endpoints không cần auth
 * - Kích hoạt @PreAuthorize / @Secured qua @EnableMethodSecurity
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final ObjectMapper objectMapper;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configure(http)) // dùng CorsConfig bean
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response,
                                                                authException) -> writeError(response,
                                                                                HttpServletResponse.SC_UNAUTHORIZED,
                                                                                ErrorCode.UNAUTHORIZED))
                                                .accessDeniedHandler((request, response,
                                                                accessDeniedException) -> writeError(response,
                                                                                HttpServletResponse.SC_FORBIDDEN,
                                                                                ErrorCode.ACCESS_DENIED)))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(SecurityConstants.PUBLIC_URLS).permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/semesters", "/api/subjects",
                                                                "/api/combos")
                                                .permitAll()
                                                .requestMatchers("/api/admin/marketplace/**")
                                                .hasAnyRole("ADMIN", "REVIEWER")
                                                .requestMatchers(HttpMethod.GET, "/api/community/**")
                                                .permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/reviewer/**").hasAnyRole("ADMIN", "REVIEWER")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(10);
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        private void writeError(HttpServletResponse response, int status, ErrorCode errorCode) throws IOException {
                response.setStatus(status);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                objectMapper.writeValue(response.getWriter(),
                                ApiResponse.error(errorCode.getMessage(), errorCode.getCode()));
        }
}
