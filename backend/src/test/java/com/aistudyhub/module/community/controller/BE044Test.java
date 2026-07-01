package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.*;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.module.community.service.ContentReportService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE044Test {

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
        private ContentReportService contentReportService;

        @Autowired
        private jakarta.persistence.EntityManager entityManager;

        private User student;
        private User anotherStudent;
        private User admin;
        private User moderator;

        private Subject subjectA;
        private Subject subjectB;

        private Document doc1;
        private Document doc2;
        private Quiz quiz1;
        private FlashcardDeck deck1;

        @BeforeEach
        void setUp() {
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
                                .build());

                anotherStudent = userRepository.save(User.builder()
                                .email("another@fpt.edu.vn")
                                .fullName("Another Student")
                                .role(Role.STUDENT)
                                .isActive(true)
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
                                .build());

                doc2 = documentRepository.save(Document.builder()
                                .user(student)
                                .subject(subjectB)
                                .title("SWP391 Architecture Document")
                                .visibility(Visibility.PUBLIC_LINK)
                                .build());

                quiz1 = quizRepository.save(Quiz.builder()
                                .creator(student)
                                .subject(subjectA)
                                .title("SWR302 Exam Prep Quiz")
                                .visibility(Visibility.PUBLIC_LINK)
                                .build());

                deck1 = flashcardDeckRepository.save(FlashcardDeck.builder()
                                .user(student)
                                .subject(subjectB)
                                .title("SWP391 Flashcards")
                                .visibility(Visibility.PUBLIC_LINK)
                                .build());
        }

        // ── 1. TEST POST /api/reports (Tạo báo cáo vi phạm) ──────────────────────

        @Test
        void createReport_Success_ForDocument() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "reasonType": "COPYRIGHT",
                                  "reportDetails": "Tài liệu này sao chép bản quyền sách.",
                                  "severityLevel": "HIGH"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.targetType").value("DOCUMENT"))
                                .andExpect(jsonPath("$.data.targetId").value(doc1.getId()))
                                .andExpect(jsonPath("$.data.targetTitle").value("SWR302 Requirement Document"))
                                .andExpect(jsonPath("$.data.reasonType").value("COPYRIGHT"))
                                .andExpect(jsonPath("$.data.reportDetails")
                                                .value("Tài liệu này sao chép bản quyền sách."))
                                .andExpect(jsonPath("$.data.severityLevel").value("HIGH"))
                                .andExpect(jsonPath("$.data.status").value("PENDING_ADMIN"))
                                .andExpect(jsonPath("$.data.reporterName").value("Normal Student"))
                                .andExpect(jsonPath("$.data.reporterId").value(student.getId()));

                assertEquals(1, contentReportRepository.count());
        }

        @Test
        void createReport_Success_ForQuiz() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "QUIZ",
                                  "targetId": %d,
                                  "reasonType": "SPAM",
                                  "reportDetails": "Quiz rác không có câu trả lời đúng"
                                }
                                """.formatted(quiz1.getId());

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.targetType").value("QUIZ"))
                                .andExpect(jsonPath("$.data.targetId").value(quiz1.getId()))
                                .andExpect(jsonPath("$.data.targetTitle").value("SWR302 Exam Prep Quiz"))
                                .andExpect(jsonPath("$.data.severityLevel").value("LOW")) // Default value
                                .andExpect(jsonPath("$.data.status").value("PENDING_ADMIN"));
        }

        @Test
        void createReport_Success_ForFlashcardDeck() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "FLASHCARD_DECK",
                                  "targetId": %d,
                                  "reasonType": "DOC_HAI",
                                  "reportDetails": "Chứa ngôn từ kích động thù địch",
                                  "severityLevel": "MEDIUM"
                                }
                                """.formatted(deck1.getId());

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.targetType").value("FLASHCARD_DECK"))
                                .andExpect(jsonPath("$.data.targetId").value(deck1.getId()))
                                .andExpect(jsonPath("$.data.severityLevel").value("MEDIUM"));
        }

        @Test
        void createReport_ValidationError_WhenInvalidReason() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "reasonType": "INVALID_REASON",
                                  "reportDetails": "Lý do không nằm trong enum"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void createReport_Conflict_WhenDuplicateReport() throws Exception {
                // 1. Tạo 1 báo cáo trước
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Báo cáo lần 1")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // 2. Gửi tiếp báo cáo lần 2 cho cùng document doc1 khi báo cáo 1 chưa xử lý
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "reasonType": "COPYRIGHT",
                                  "reportDetails": "Cố tình báo cáo trùng lặp"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void createReport_ValidationError_WhenMissingFields() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "",
                                  "targetId": null,
                                  "reasonType": "SPAM"
                                }
                                """;

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void createReport_NotFound_WhenResourceNotExists() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": 9999,
                                  "reasonType": "SPAM"
                                }
                                """;

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
        }

        @Test
        void createReport_ValidationError_WhenInvalidType() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "INVALID_TYPE",
                                  "targetId": 1,
                                  "reasonType": "SPAM"
                                }
                                """;

                mockMvc.perform(post("/api/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("INVALID_REPORT_TARGET"));
        }

        @Test
        void createReport_Unauthorized_WhenNoToken() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": 1,
                                  "reasonType": "SPAM"
                                }
                                """;

                mockMvc.perform(post("/api/reports")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.success").value(false));
        }

        // ── 2. TEST GET /api/reports/my (Xem báo cáo cá nhân) ────────────────────

        @Test
        void getMyReports_ReturnsOnlyOwnReports_SortedNewest() throws Exception {
                // 1. Tạo báo cáo của student
                ContentReport r1 = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Báo cáo 1 của student")
                                .severityLevel("LOW")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                ContentReport r2 = contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Báo cáo 2 của student")
                                .severityLevel("HIGH")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // 2. Tạo báo cáo của another student -> Không được trả về cho student
                contentReportRepository.save(ContentReport.builder()
                                .reporter(anotherStudent)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Báo cáo của another student")
                                .build());

                // Update thời gian tạo khác biệt để kiểm tra sort
                entityManager.createNativeQuery("UPDATE content_reports SET created_at = :createdAt WHERE id = :id")
                                .setParameter("createdAt", java.time.LocalDateTime.now().minusDays(1))
                                .setParameter("id", r1.getId())
                                .executeUpdate();

                entityManager.createNativeQuery("UPDATE content_reports SET created_at = :createdAt WHERE id = :id")
                                .setParameter("createdAt", java.time.LocalDateTime.now())
                                .setParameter("id", r2.getId())
                                .executeUpdate();

                entityManager.flush();
                entityManager.clear();

                // 3. Gọi API
                mockMvc.perform(get("/api/reports/my")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(2))
                                .andExpect(jsonPath("$.data.items[0].id").value(r2.getId())) // Sắp xếp mới nhất trước
                                .andExpect(jsonPath("$.data.items[0].reportDetails").value("Báo cáo 2 của student"))
                                .andExpect(jsonPath("$.data.items[1].id").value(r1.getId()))
                                .andExpect(jsonPath("$.data.items[1].reportDetails").value("Báo cáo 1 của student"))
                                .andExpect(jsonPath("$.data.totalElements").value(2));
        }

        @Test
        void getMyReports_FilterByKeyword() throws Exception {
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Tài liệu chứa quảng cáo spam")
                                .build());

                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Bản quyền tài liệu môn SWP391")
                                .build());

                mockMvc.perform(get("/api/reports/my")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student)))
                                .param("keyword", "SWP391"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].reportDetails")
                                                .value("Bản quyền tài liệu môn SWP391"));
        }

        // ── 3. TEST GET /api/admin/reports (Quản trị viên xem báo cáo) ─────────────

        @Test
        void getAdminReports_Success_ForAdmin() throws Exception {
                // Seed 2 reports
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Báo cáo spam")
                                .severityLevel("LOW")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                contentReportRepository.save(ContentReport.builder()
                                .reporter(anotherStudent)
                                .quiz(quiz1)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Bản quyền quiz")
                                .severityLevel("HIGH")
                                .status(ReportStatus.RESOLVED)
                                .build());

                // Gọi API với tư cách Admin
                mockMvc.perform(get("/api/admin/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .param("status", "RESOLVED"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].reportDetails").value("Bản quyền quiz"))
                                .andExpect(jsonPath("$.data.items[0].severityLevel").value("HIGH"))
                                .andExpect(jsonPath("$.data.items[0].status").value("RESOLVED"));
        }

        @Test
        void getAdminReports_FiltersCorrectly() throws Exception {
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Report A")
                                .severityLevel("LOW")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Report B")
                                .severityLevel("HIGH")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // Lọc theo severityLevel = HIGH
                mockMvc.perform(get("/api/admin/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                                .param("severityLevel", "HIGH"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].reportDetails").value("Report B"));
        }

        @Test
        void getAdminReports_Forbidden_ForNormalStudent() throws Exception {
                mockMvc.perform(get("/api/admin/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(student))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
        }

        @Test
        void getAdminReports_Success_ForScopedModerator() throws Exception {
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

                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Bản quyền SWP391")
                                .severityLevel("HIGH")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Spam SWR302")
                                .severityLevel("LOW")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                CustomUserDetails moderatorDetails = new CustomUserDetails(moderator, java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_STUDENT"),
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MODERATOR")));

                mockMvc.perform(get("/api/admin/reports")
                                .with(SecurityMockMvcRequestPostProcessors.user(moderatorDetails)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].reportDetails").value("Spam SWR302"));
        }

        @Test
        void getAdminReports_FilterByModeratorScope() throws Exception {
                // 1. Tạo vai trò SUBJECT_MODERATOR cho moderator đối với môn học subjectA
                // (SWR302)
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

                // 2. Tạo 2 báo cáo:
                // Report 1: Liên kết với doc1 (SWR302) -> moderator có quyền
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Spam SWR302")
                                .severityLevel("LOW")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // Report 2: Liên kết với doc2 (SWP391) -> moderator không có quyền
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Bản quyền SWP391")
                                .severityLevel("HIGH")
                                .status(ReportStatus.PENDING_ADMIN)
                                .build());

                // Giả lập đăng nhập moderator để gọi Service trực tiếp
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                userDetails(moderator), null, userDetails(moderator).getAuthorities()));

                var serviceResult = contentReportService.getAdminReports(0, 10, null, "newest", null, null);
                assertEquals(1, serviceResult.getItems().size());
                assertEquals("Spam SWR302", serviceResult.getItems().get(0).getReportDetails());
        }

        @Test
        void testModeratorServiceLogic_Directly() {
                // Giả lập role cho moderator quản lý môn học subjectA (id = 1)
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

                // Báo cáo 1: thuộc doc1 (subjectA)
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc1)
                                .reasonType("SPAM")
                                .reportDetails("Spam SWR302")
                                .build());

                // Báo cáo 2: thuộc doc2 (subjectB)
                contentReportRepository.save(ContentReport.builder()
                                .reporter(student)
                                .document(doc2)
                                .reasonType("COPYRIGHT")
                                .reportDetails("Bản quyền SWP391")
                                .build());

                // Giả lập đăng nhập moderator để gọi Service trực tiếp
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                                userDetails(moderator), null, userDetails(moderator).getAuthorities()));

                var result = contentReportService.getAdminReports(0, 10, null, "newest", null, null);

                // Kết quả trả về chỉ được chứa đúng 1 báo cáo thuộc môn SWR302
                assertEquals(1, result.getItems().size());
                assertEquals("Spam SWR302", result.getItems().get(0).getReportDetails());
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }
}
