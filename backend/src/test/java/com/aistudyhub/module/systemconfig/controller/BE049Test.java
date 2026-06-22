package com.aistudyhub.module.systemconfig.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.PasswordReset;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.auth.dto.ForgotPasswordRequest;
import com.aistudyhub.module.auth.service.AuthService;
import com.aistudyhub.module.auth.service.EmailService;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.repository.PasswordResetRepository;
import com.aistudyhub.repository.SystemConfigRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE049Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private PasswordResetRepository passwordResetRepository;

    @Autowired
    private AuthService authService;

    @MockBean
    private EmailService emailService;

    private User admin;
    private User student;

    @BeforeEach
    void setUp() {
        passwordResetRepository.deleteAll();
        systemConfigRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        student = userRepository.save(User.builder()
                .email("student@fpt.edu.vn")
                .fullName("Student User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
    }

    @Test
    void listPublicConfigs_AllowsAnonymousAndFiltersUnsafeRows() throws Exception {
        saveConfig(SystemConfigKeys.AI_CHAT_DAILY_LIMIT, "50", "Public config", true);
        saveConfig(SystemConfigKeys.AI_SUMMARY_DAILY_LIMIT, "10", "Hidden because not flagged", false);
        saveConfig("OPENAI_API_KEY", "sk-secret", "Unsafe key", true);

        mockMvc.perform(get("/api/system-configs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].configKey").value(SystemConfigKeys.AI_CHAT_DAILY_LIMIT))
                .andExpect(jsonPath("$.data[0].configValue").value("50"));
    }

    @Test
    void listPublicConfigs_ReturnsSortedItems() throws Exception {
        saveConfig(SystemConfigKeys.FREE_DOWNLOAD_WAIT_SECONDS, "30", "Wait", true);
        saveConfig(SystemConfigKeys.AI_CHAT_DAILY_LIMIT, "50", "Chat", true);

        mockMvc.perform(get("/api/system-configs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].configKey").value(SystemConfigKeys.AI_CHAT_DAILY_LIMIT))
                .andExpect(jsonPath("$.data[1].configKey").value(SystemConfigKeys.FREE_DOWNLOAD_WAIT_SECONDS));
    }

    @Test
    void createPublicConfig_AdminCrudKeepsItVisibleOnPublicEndpoint() throws Exception {
        mockMvc.perform(post("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "ai_chat_daily_limit",
                                  "configValue": "75",
                                  "description": "Daily chat limit"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.configKey").value(SystemConfigKeys.AI_CHAT_DAILY_LIMIT));

        SystemConfig saved = systemConfigRepository.findByConfigKey(SystemConfigKeys.AI_CHAT_DAILY_LIMIT)
                .orElseThrow();
        assertTrue(saved.isPublic());

        mockMvc.perform(get("/api/system-configs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].configKey").value(SystemConfigKeys.AI_CHAT_DAILY_LIMIT))
                .andExpect(jsonPath("$.data[0].configValue").value("75"));
    }

    @Test
    void forgotPassword_UsesResetTokenExpireMinutesFromSystemConfig() {
        saveConfig(SystemConfigKeys.RESET_TOKEN_EXPIRE_MINUTES, "45", "Reset token expiry", false);

        LocalDateTime before = LocalDateTime.now();
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail(student.getEmail());

        authService.forgotPassword(request);

        PasswordReset saved = passwordResetRepository.findAll().get(0);
        assertFalse(saved.getExpiredAt().isBefore(before.plusMinutes(44)));
        assertTrue(saved.getExpiredAt().isBefore(before.plusMinutes(46)));

        verify(emailService).sendPasswordResetEmail(
                eq(student.getEmail()),
                eq(student.getFullName()),
                anyString(),
                eq(45)
        );
    }

    private SystemConfig saveConfig(String key, String value, String description, boolean isPublic) {
        return systemConfigRepository.save(SystemConfig.builder()
                .configKey(key.trim().toUpperCase())
                .configValue(value)
                .description(description)
                .isPublic(isPublic)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
