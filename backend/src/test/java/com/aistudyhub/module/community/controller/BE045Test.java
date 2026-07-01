package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.*;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
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

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE045Test {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private DocumentRepository documentRepository;

        @Autowired
        private QuizRepository quizRepository;

        @Autowired
        private FlashcardDeckRepository flashcardDeckRepository;

        @Autowired
        private ContentReportRepository contentReportRepository;

        @Autowired
        private CommunityRoleRepository communityRoleRepository;

        @Autowired
        private NotificationRepository notificationRepository;

        @Autowired
        private com.aistudyhub.module.community.service.ContentReportService contentReportService;

        private User student;
        private User admin;
        private User moderator;

        private Subject subjectA;
        private Subject subjectB;

        private Document doc1;
        private Document doc2;

        @BeforeEach
        void setUp() {
                notificationRepository.deleteAll();
                contentReportRepository.deleteAll();
                communityRoleRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                quizRepository.deleteAll();
                documentRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed Users
                student = userRepository.save(User.builder()
                                .email("student@fpt.edu.vn")
                                .fullName("Normal Student")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .reputationPoints(100)
                                .build());

                admin = userRepository.save(User.builder()
                                .email("admin@aistudyhub.com")
                                .fullName("System Admin")
                                .role(Role.ADMIN)
                                .isActive(true)
                                .build());

                moderator = userRepository.save(User.builder()
                                .email("moderator@fpt.edu.vn")
                                .fullName("Subject Moderator")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // 2. Seed Subjects
                subjectA = subjectRepository.save(Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .standardSemesterNumber(4)
                                .build());

                subjectB = subjectRepository.save(Subject.builder()
                                .code("SWP391")
                                .name("Application Development Project")
                                .standardSemesterNumber(5)
                                .build());

                // 3. Seed Resources
                doc1 = documentRepository.save(Document.builder()
                                .user(student)
                                .subject(subjectA)
                                .title("SWR302 Requirement Document")
                                .visibility(Visibility.PUBLIC_LINK)
                                .marketStatus(MarketStatus.APPROVED)
                                .build());

                doc2 = documentRepository.save(Document.builder()
                                .user(student)
                                .subject(subjectB)
                                .title("SWP391 Architecture Document")
                                .visibility(Visibility.PUBLIC_LINK)
                                .build());

        }

        // ── 1. TEST PATCH /api/admin/reports/{id}/resolve (Duyệt báo cáo) ──────────

        @Test
        void resolveReport_Success_ByAdmin() throws Exception {
                // Tạo 1 report PENDING_ADMIN
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Copyrighted document content")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                String requestBody = """
                                {
                                  "adminNote": "Verified violation and removed."
                                }
                                """;

                mockMvc.perform(patch("/api/admin/reports/{id}/resolve", report.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Report approved successfully"))
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].status").value("RESOLVED"))
                                .andExpect(jsonPath("$.data.items[0].adminNote").value("Verified violation and removed."))
                                .andExpect(jsonPath("$.data.items[0].resolvedById").value(admin.getId()))
                                .andExpect(jsonPath("$.data.items[0].resolvedByName").value("System Admin"));

                // Kiểm tra db
                ContentReport updated = contentReportRepository.findById(report.getId()).orElseThrow();
                assertEquals(ReportStatus.RESOLVED, updated.getStatus());
                assertEquals("Verified violation and removed.", updated.getAdminNote());
                assertEquals(admin.getId(), updated.getResolvedBy().getId());

                // Kiểm tra đã tạo thông báo cho reporter
                assertTrue(notificationRepository.findAll().stream()
                                .anyMatch(n -> n.getUser().getId().equals(student.getId())
                                                && n.getTitle().contains("Report processed")));
        }

        @Test
        void rejectReport_Success_ByAdmin() throws Exception {
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Nonsense spam report")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                String requestBody = """
                                {
                                  "adminNote": "Rejected because no spam signs."
                                }
                                """;

                mockMvc.perform(patch("/api/admin/reports/{id}/reject", report.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Report rejected successfully"))
                                .andExpect(jsonPath("$.data.items[0].status").value("REJECTED"))
                                .andExpect(jsonPath("$.data.items[0].adminNote")
                                                .value("Rejected because no spam signs."));

                ContentReport updated = contentReportRepository.findById(report.getId()).orElseThrow();
                assertEquals(ReportStatus.REJECTED, updated.getStatus());
        }

        @Test
        void resolveReport_Conflict_WhenAlreadyProcessed() throws Exception {
                // Tạo report đã RESOLVED
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("COPYRIGHT")
                                .status(ReportStatus.RESOLVED)
                                .build());

                String requestBody = """
                                {
                                  "adminNote": "Xử lý lại"
                                }
                                """;

                mockMvc.perform(patch("/api/admin/reports/{id}/resolve", report.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("REPORT_ALREADY_PROCESSED"));
        }

        @Test
        void resolveReport_Forbidden_ForNormalStudent() throws Exception {
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                mockMvc.perform(patch("/api/admin/reports/{id}/resolve", report.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        void resolveReport_Success_ByScopedModerator() throws Exception {
                // Cấp quyền Moderator môn subjectA cho moderator
                communityRoleRepository.save(CommunityRole.builder()
                                .user(moderator)
                                .grantedBy(admin)
                                .roleType(CommunityRoleType.CONTENT_MODERATOR)
                                .scopeType(CommunityScopeType.SUBJECT)
                                .scopeId(subjectA.getId())
                                .startAt(LocalDateTime.now().minusDays(1))
                                .endAt(LocalDateTime.now().plusDays(10))
                                .status(CommunityRoleStatus.ACTIVE)
                                .build());

                // Report thuộc doc1 (môn subjectA) -> Moderator có quyền
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // Giả lập đăng nhập moderator
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                userDetails(moderator), null, userDetails(moderator).getAuthorities()));

                var result = contentReportService.resolveReport(report.getId(), "Approved by Moderator", 0, 10);
                assertEquals(1, result.getItems().size());
                assertEquals(ReportStatus.RESOLVED.name(), result.getItems().get(0).getStatus());
        }

        @Test
        void resolveReportEndpoint_Success_ByScopedModerator() throws Exception {
                communityRoleRepository.save(CommunityRole.builder()
                                .user(moderator)
                                .grantedBy(admin)
                                .roleType(CommunityRoleType.CONTENT_MODERATOR)
                                .scopeType(CommunityScopeType.SUBJECT)
                                .scopeId(subjectA.getId())
                                .startAt(LocalDateTime.now().minusDays(1))
                                .endAt(LocalDateTime.now().plusDays(10))
                                .status(CommunityRoleStatus.ACTIVE)
                                .build());

                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                CustomUserDetails moderatorDetails = new CustomUserDetails(moderator, java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_STUDENT"),
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MODERATOR")));

                mockMvc.perform(patch("/api/admin/reports/{id}/resolve", report.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(moderatorDetails))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"adminNote\":\"Approved by Moderator\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items[0].status").value("RESOLVED"));
        }

        @Test
        void resolveReport_Forbidden_ByScopedModerator_WhenOutOfScope() throws Exception {
                // Cấp quyền Moderator môn subjectA
                communityRoleRepository.save(CommunityRole.builder()
                                .user(moderator)
                                .grantedBy(admin)
                                .roleType(CommunityRoleType.CONTENT_MODERATOR)
                                .scopeType(CommunityScopeType.SUBJECT)
                                .scopeId(subjectA.getId())
                                .startAt(LocalDateTime.now().minusDays(1))
                                .endAt(LocalDateTime.now().plusDays(10))
                                .status(CommunityRoleStatus.ACTIVE)
                                .build());

                // Report thuộc doc2 (môn subjectB) -> Moderator không có quyền
                ContentReport report = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("SPAM")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // Giả lập đăng nhập moderator
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                userDetails(moderator), null, userDetails(moderator).getAuthorities()));

                try {
                        contentReportService.resolveReport(report.getId(), "Attempting to resolve out of scope", 0, 10);
                        org.junit.jupiter.api.Assertions.fail("Expected AppException to be thrown");
                } catch (com.aistudyhub.common.exception.AppException e) {
                        assertEquals(com.aistudyhub.common.exception.ErrorCode.COMMUNITY_ROLE_PERMISSION_DENIED,
                                        e.getErrorCode());
                }
        }

        // ── 2. TEST PATCH /api/admin/content/{targetType}/{targetId}/hide (Ẩn nội
        // dung) ──

        @Test
        void hideContent_Success_ForDocument() throws Exception {
                String requestBody = """
                                {
                                  "reason": "Contains harmful content"
                                }
                                """;

                mockMvc.perform(patch("/api/admin/content/DOCUMENT/{id}/hide", doc1.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Content hidden successfully"))
                                .andExpect(jsonPath("$.data.id").value(student.getId()))
                                .andExpect(jsonPath("$.data.email").value("student@fpt.edu.vn"));

                // Kiểm tra doc1 bị đổi trạng thái
                Document updatedDoc = documentRepository.findById(doc1.getId()).orElseThrow();
                assertEquals(Visibility.PRIVATE, updatedDoc.getVisibility());
                assertEquals(MarketStatus.REJECTED, updatedDoc.getMarketStatus());

                // Kiểm tra thông báo gửi cho content owner
                assertTrue(notificationRepository.findAll().stream()
                                .anyMatch(n -> n.getUser().getId().equals(student.getId())
                                                && n.getTitle().contains("Content hidden")
                                                && n.getContent().contains("Contains harmful content")));
        }

        @Test
        void restoreContent_Success_ForDocument() throws Exception {
                // Giả lập doc1 đang bị ẩn (PRIVATE)
                doc1.setVisibility(Visibility.PRIVATE);
                documentRepository.save(doc1);

                String requestBody = """
                                {
                                  "reason": "Restored after modifications"
                                }
                                """;

                mockMvc.perform(patch("/api/admin/content/DOCUMENT/{id}/restore", doc1.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Content restored successfully"));

                Document updatedDoc = documentRepository.findById(doc1.getId()).orElseThrow();
                assertEquals(Visibility.PUBLIC_LINK, updatedDoc.getVisibility());

                // Kiểm tra thông báo gửi cho content owner
                assertTrue(notificationRepository.findAll().stream()
                                .anyMatch(n -> n.getUser().getId().equals(student.getId())
                                                && n.getTitle().contains("Content restored")));
        }

        @Test
        void hideContent_Forbidden_ForNormalStudent() throws Exception {
                mockMvc.perform(patch("/api/admin/content/DOCUMENT/{id}/hide", doc1.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"reason\":\"Destructive content\"}"))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false));
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }
}
