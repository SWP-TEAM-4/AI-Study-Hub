package com.aistudyhub.module.systemconfig.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE036Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    private User admin;
    private User student;

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

        student = userRepository.save(User.builder()
                .email("student@fpt.edu.vn")
                .fullName("Student User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
    }

    @Test
    void listConfigs_ReturnsSortedItems() throws Exception {
        saveConfig("z_last_key", "100", "Last");
        saveConfig("A_FIRST_KEY", "10", "First");

        mockMvc.perform(get("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].configKey").value("A_FIRST_KEY"))
                .andExpect(jsonPath("$.data[1].configKey").value("Z_LAST_KEY"));
    }

    @Test
    void createConfig_Success_NormalizesKeyAndDescription() throws Exception {
        mockMvc.perform(post("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": " max_upload_size_mb ",
                                  "configValue": "50",
                                  "description": " Dung luong upload toi da "
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.configKey").value("MAX_UPLOAD_SIZE_MB"))
                .andExpect(jsonPath("$.data.configValue").value("50"))
                .andExpect(jsonPath("$.data.description").value("Dung luong upload toi da"));

        SystemConfig saved = systemConfigRepository.findAll().get(0);
        assertEquals("MAX_UPLOAD_SIZE_MB", saved.getConfigKey());
        assertEquals("Dung luong upload toi da", saved.getDescription());
    }

    @Test
    void createConfig_Conflict_WhenKeyDuplicate() throws Exception {
        saveConfig("MAX_UPLOAD_SIZE_MB", "50", "Original");

        mockMvc.perform(post("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "max_upload_size_mb",
                                  "configValue": "100",
                                  "description": "Duplicate"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("SYSTEM_CONFIG_KEY_DUPLICATE"));
    }

    @Test
    void updateConfig_Success() throws Exception {
        SystemConfig config = saveConfig("AI_CHAT_DAILY_LIMIT", "50", "Daily limit");

        mockMvc.perform(put("/api/admin/system-configs/{id}", config.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "AI_CHAT_DAILY_LIMIT",
                                  "configValue": "75",
                                  "description": "Updated limit"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(config.getId()))
                .andExpect(jsonPath("$.data.configValue").value("75"))
                .andExpect(jsonPath("$.data.description").value("Updated limit"));

        SystemConfig updated = systemConfigRepository.findById(config.getId()).orElseThrow();
        assertEquals("75", updated.getConfigValue());
        assertEquals("Updated limit", updated.getDescription());
    }

    @Test
    void updateConfig_Conflict_WhenUpdatingToExistingKey() throws Exception {
        SystemConfig current = saveConfig("AI_CHAT_DAILY_LIMIT", "50", "Current");
        saveConfig("RESET_TOKEN_EXPIRE_MINUTES", "30", "Other");

        mockMvc.perform(put("/api/admin/system-configs/{id}", current.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "RESET_TOKEN_EXPIRE_MINUTES",
                                  "configValue": "90",
                                  "description": "Conflict"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("SYSTEM_CONFIG_KEY_DUPLICATE"));
    }

    @Test
    void updateConfig_NotFound_WhenIdMissing() throws Exception {
        mockMvc.perform(put("/api/admin/system-configs/{id}", 9999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "AI_CHAT_DAILY_LIMIT",
                                  "configValue": "75",
                                  "description": "Updated limit"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("SYSTEM_CONFIG_NOT_FOUND"));
    }

    @Test
    void deleteConfig_Success() throws Exception {
        SystemConfig config = saveConfig("FREE_DOWNLOAD_WAIT_SECONDS", "30", "Wait");

        mockMvc.perform(delete("/api/admin/system-configs/{id}", config.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Deleted successfully"))
                .andExpect(jsonPath("$.data.deleted").value(true));

        assertFalse(systemConfigRepository.findById(config.getId()).isPresent());
    }

    @Test
    void deleteConfig_NotFound_WhenIdMissing() throws Exception {
        mockMvc.perform(delete("/api/admin/system-configs/{id}", 9999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("SYSTEM_CONFIG_NOT_FOUND"));
    }

    @Test
    void adminEndpoints_Forbidden_ForNonAdmin() throws Exception {
        SystemConfig config = saveConfig("AI_SUMMARY_DAILY_LIMIT", "10", "Summary limit");

        mockMvc.perform(get("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        mockMvc.perform(delete("/api/admin/system-configs/{id}", config.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    void createConfig_ValidationError_WhenConfigValueBlank() throws Exception {
        mockMvc.perform(post("/api/admin/system-configs")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "MAX_UPLOAD_SIZE_MB",
                                  "configValue": "   ",
                                  "description": "Invalid"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void getValueByKey_ServiceReturnsValueAndThrowsWhenMissing() {
        saveConfig("BASE_REPUTATION_PER_UPLOAD", "10", "Base reputation");

        assertEquals("10", systemConfigService.getValueByKey("base_reputation_per_upload"));

        AppException exception = assertThrows(AppException.class,
                () -> systemConfigService.getValueByKey("missing_key"));

        assertEquals("SYSTEM_CONFIG_NOT_FOUND", exception.getErrorCode().getCode());
        assertTrue(exception.getMessage().contains("MISSING_KEY"));
    }

    private SystemConfig saveConfig(String key, String value, String description) {
        return systemConfigRepository.save(SystemConfig.builder()
                .configKey(key.trim().toUpperCase())
                .configValue(value)
                .description(description)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
