package com.aistudyhub.module.admin.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.User;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE037Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User studentA;
    private User studentB;
    private User inactiveStudent;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        admin = saveUser("admin@aistudyhub.com", "System Admin", Role.ADMIN, true);
        studentA = saveUser("alpha@fpt.edu.vn", "Alpha Student", Role.STUDENT, true);
        studentB = saveUser("beta@fpt.edu.vn", "Beta Student", Role.STUDENT, true);
        inactiveStudent = saveUser("inactive@fpt.edu.vn", "Inactive User", Role.STUDENT, false);
    }

    @Test
    void listUsers_SupportsPaginationSearchFilterAndSort() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .param("keyword", "student")
                        .param("role", "STUDENT")
                        .param("isActive", "true")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].email").value(studentB.getEmail()))
                .andExpect(jsonPath("$.data.items[1].email").value(studentA.getEmail()));
    }

    @Test
    void listUsers_ReturnsValidationError_WhenRoleFilterInvalid() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .param("role", "MODERATOR"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void getUserDetail_Success() throws Exception {
        mockMvc.perform(get("/api/admin/users/{id}", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(studentA.getId()))
                .andExpect(jsonPath("$.data.email").value(studentA.getEmail()))
                .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }

    @Test
    void getUserDetail_NotFound_WhenMissing() throws Exception {
        mockMvc.perform(get("/api/admin/users/{id}", 9999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("USER_NOT_FOUND"));
    }

    @Test
    void toggleActive_Success() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/active", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isActive": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(studentA.getId()))
                .andExpect(jsonPath("$.data.isActive").value(false));

        User updated = userRepository.findById(studentA.getId()).orElseThrow();
        assertEquals(false, updated.getIsActive());
    }

    @Test
    void toggleActive_BadRequest_WhenAdminDeactivatesSelf() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/active", admin.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isActive": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("CANNOT_DEACTIVATE_SELF"));
    }

    @Test
    void toggleActive_ValidationError_WhenBodyMissingField() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/active", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void changeRole_Success() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/role", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "ADMIN"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(studentA.getId()))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));

        User updated = userRepository.findById(studentA.getId()).orElseThrow();
        assertEquals(Role.ADMIN, updated.getRole());
    }

    @Test
    void changeRole_BadRequest_WhenReviewerRequested() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/role", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "REVIEWER"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Role must be STUDENT or ADMIN"))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void changeRole_BadRequest_WhenRoleInvalid() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/role", studentA.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "MODERATOR"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void adminEndpoints_Forbidden_ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentA))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/admin/users/{id}/role", studentB.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "ADMIN"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    private User saveUser(String email, String fullName, Role role, boolean isActive) {
        return userRepository.save(User.builder()
                .email(email)
                .fullName(fullName)
                .role(role)
                .isActive(isActive)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
