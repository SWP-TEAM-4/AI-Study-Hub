package com.aistudyhub.module.feedback.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.SystemFeedbackStatus;
import com.aistudyhub.entity.SystemFeedback;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.SystemFeedbackRepository;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE035Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemFeedbackRepository systemFeedbackRepository;

    private User admin;
    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        systemFeedbackRepository.deleteAll();
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

        otherStudent = userRepository.save(User.builder()
                .email("other@fpt.edu.vn")
                .fullName("Other Student")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
    }

    @Test
    void submitFeedback_Success() throws Exception {
        mockMvc.perform(post("/api/feedbacks")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Upload bị chậm",
                                  "content": "Khi upload PDF lớn, hệ thống phản hồi chậm.",
                                  "screenUrl": "/documents/upload"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(student.getId()))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.screenUrl").value("/documents/upload"));

        SystemFeedback feedback = systemFeedbackRepository.findAll().get(0);
        assertEquals(SystemFeedbackStatus.OPEN, feedback.getStatus());
        assertEquals(student.getId(), feedback.getUser().getId());
    }

    @Test
    void adminListFeedbacks_SupportsFilterAndPagination() throws Exception {
        saveFeedback(student, "Upload bị chậm", "PDF lớn chậm", "/documents/upload", SystemFeedbackStatus.OPEN);
        saveFeedback(otherStudent, "UI bug", "Nút bị lệch", "/home", SystemFeedbackStatus.IN_PROGRESS);
        saveFeedback(student, "Upload failed", "Mất kết nối", "/documents/upload", SystemFeedbackStatus.OPEN);

        mockMvc.perform(get("/api/admin/feedbacks")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .param("status", "OPEN")
                        .param("keyword", "upload")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].status").value("OPEN"));
    }

    @Test
    void getMyFeedbacks_ReturnsOnlyCurrentUsersFeedbacks() throws Exception {
        saveFeedback(student, "Upload bị chậm", "PDF lớn chậm", "/documents/upload", SystemFeedbackStatus.OPEN);
        saveFeedback(otherStudent, "UI bug", "Nút bị lệch", "/home", SystemFeedbackStatus.IN_PROGRESS);
        saveFeedback(student, "Upload failed", "Mất kết nối", "/documents/upload", SystemFeedbackStatus.RESOLVED);

        mockMvc.perform(get("/api/feedbacks")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].userId").value(student.getId()))
                .andExpect(jsonPath("$.data.items[1].userId").value(student.getId()));
    }

    @Test
    void adminUpdateStatus_Success_PersistsAdminNote() throws Exception {
        SystemFeedback feedback = saveFeedback(student,
                "Upload bị chậm",
                "PDF lớn chậm",
                "/documents/upload",
                SystemFeedbackStatus.OPEN);

        mockMvc.perform(patch("/api/admin/feedbacks/{id}/status", feedback.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "IN_PROGRESS",
                                  "adminNote": "Da chuyen dev kiem tra"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(feedback.getId()))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        SystemFeedback updated = systemFeedbackRepository.findById(feedback.getId()).orElseThrow();
        assertEquals(SystemFeedbackStatus.IN_PROGRESS, updated.getStatus());
        assertEquals("Da chuyen dev kiem tra", updated.getAdminNote());
    }

    @Test
    void adminUpdateStatus_NotFound_WhenFeedbackMissing() throws Exception {
        mockMvc.perform(patch("/api/admin/feedbacks/{id}/status", 9999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "RESOLVED"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("SYSTEM_FEEDBACK_NOT_FOUND"));
    }

    @Test
    void adminUpdateStatus_BadRequest_WhenStatusInvalid() throws Exception {
        SystemFeedback feedback = saveFeedback(student,
                "Upload bị chậm",
                "PDF lớn chậm",
                "/documents/upload",
                SystemFeedbackStatus.OPEN);

        mockMvc.perform(patch("/api/admin/feedbacks/{id}/status", feedback.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "DONE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void adminEndpoints_Forbidden_ForNonAdmin() throws Exception {
        SystemFeedback feedback = saveFeedback(student,
                "Upload bị chậm",
                "PDF lớn chậm",
                "/documents/upload",
                SystemFeedbackStatus.OPEN);

        mockMvc.perform(get("/api/admin/feedbacks")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/admin/feedbacks/{id}/status", feedback.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "RESOLVED"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    void submitFeedback_ValidationError_WhenScreenUrlMissing() throws Exception {
        mockMvc.perform(post("/api/feedbacks")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Upload bị chậm",
                                  "content": "Khi upload PDF lớn, hệ thống phản hồi chậm.",
                                  "screenUrl": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void adminUpdateStatus_CanClearAdminNote() throws Exception {
        SystemFeedback feedback = saveFeedback(student,
                "Upload bị chậm",
                "PDF lớn chậm",
                "/documents/upload",
                SystemFeedbackStatus.IN_PROGRESS);
        feedback.setAdminNote("Temporary note");
        systemFeedbackRepository.save(feedback);

        mockMvc.perform(patch("/api/admin/feedbacks/{id}/status", feedback.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "RESOLVED",
                                  "adminNote": "   "
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));

        SystemFeedback updated = systemFeedbackRepository.findById(feedback.getId()).orElseThrow();
        assertEquals(SystemFeedbackStatus.RESOLVED, updated.getStatus());
        assertNull(updated.getAdminNote());
    }

    private SystemFeedback saveFeedback(User user,
            String title,
            String content,
            String screenUrl,
            SystemFeedbackStatus status) {
        return systemFeedbackRepository.save(SystemFeedback.builder()
                .user(user)
                .title(title)
                .content(content)
                .screenUrl(screenUrl)
                .status(status)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
