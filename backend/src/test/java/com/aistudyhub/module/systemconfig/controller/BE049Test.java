package com.aistudyhub.module.systemconfig.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.SystemConfigRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    private SystemConfigService systemConfigService;

    private User admin;

    @BeforeEach
    void setUp() {
        systemConfigRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());
    }

    @Test
    void publicConfigs_ReturnOnlyWhitelistedItems_WithoutAuthentication() throws Exception {
        saveConfig("AI_CHAT_DAILY_LIMIT", "50", "Public quota", true);
        saveConfig("RESET_TOKEN_EXPIRE_MINUTES", "30", "Internal auth config", false);

        mockMvc.perform(get("/api/system-configs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].configKey").value("AI_CHAT_DAILY_LIMIT"))
                .andExpect(jsonPath("$.data[0].configValue").value("50"))
                .andExpect(jsonPath("$.data[0].isPublic").value(true));
    }

    @Test
    void adminCrud_CanManageIsPublicFlag() throws Exception {
        mockMvc.perform(post("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "FREE_DOWNLOAD_WAIT_SECONDS",
                                  "configValue": "45",
                                  "description": "Public download wait",
                                  "isPublic": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPublic").value(true));

        SystemConfig created = systemConfigRepository.findByConfigKey("FREE_DOWNLOAD_WAIT_SECONDS").orElseThrow();
        assertTrue(Boolean.TRUE.equals(created.getIsPublic()));

        mockMvc.perform(put("/api/admin/system-configs/{id}", created.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "FREE_DOWNLOAD_WAIT_SECONDS",
                                  "configValue": "60",
                                  "description": "Now internal",
                                  "isPublic": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configValue").value("60"))
                .andExpect(jsonPath("$.data.isPublic").value(false));

        SystemConfig updated = systemConfigRepository.findById(created.getId()).orElseThrow();
        assertEquals("60", updated.getConfigValue());
        assertFalse(Boolean.TRUE.equals(updated.getIsPublic()));
    }

    @Test
    void getIntValueByKeyOrDefault_UsesStoredValueAndFallsBackWhenInvalid() {
        saveConfig("RESET_TOKEN_EXPIRE_MINUTES", "45", "Auth reset expiry", false);
        saveConfig("AI_SUMMARY_DAILY_LIMIT", "invalid-number", "Broken config", true);

        assertEquals(45, systemConfigService.getIntValueByKeyOrDefault("reset_token_expire_minutes", 30));
        assertEquals(10, systemConfigService.getIntValueByKeyOrDefault("ai_summary_daily_limit", 10));
        assertEquals(5, systemConfigService.getIntValueByKeyOrDefault("missing_config", 5));
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
