package com.aistudyhub.module.activitylog.controller;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.ActivityLog;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.Notification;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.document.service.StorageService;
import com.aistudyhub.repository.ActivityLogRepository;
import com.aistudyhub.repository.ChatMessageRepository;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.NotificationRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.SystemConfigRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BE051Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private NotebookRepository notebookRepository;

    @Autowired
    private NotebookDocumentRepository notebookDocumentRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private CommunityRoleRepository communityRoleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @MockBean
    private StorageService storageService;

    private User admin;
    private User student;
    private User otherUser;
    private Subject subject;

    @BeforeEach
    void setUp() {
        activityLogRepository.deleteAll();
        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        notebookDocumentRepository.deleteAll();
        communityRoleRepository.deleteAll();
        notificationRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        notebookRepository.deleteAll();
        systemConfigRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin-be051@aistudyhub.com")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Admin BE051")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        student = userRepository.save(User.builder()
                .email("student-be051@fpt.edu.vn")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Student BE051")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other-be051@fpt.edu.vn")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Other BE051")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subject = subjectRepository.save(Subject.builder()
                .code("SWR302")
                .name("Software Requirements")
                .standardSemesterNumber(4)
                .build());
    }

    @Test
    void adminCanFilterAllLogs_AndUserOnlySeesOwnLogs() throws Exception {
        saveActivityLog(student, ActivityActionType.UPLOAD_DOCUMENT, ActivityTargetType.DOCUMENT, 11L,
                Map.of("title", "SWR302 Notes"), "swr302 upload notes");
        saveActivityLog(otherUser, ActivityActionType.CHAT_AI, ActivityTargetType.CHAT_SESSION, 22L,
                Map.of("questionPreview", "How to write SRS"), "chat ai srs");

        mockMvc.perform(get("/api/admin/activity-logs")
                        .param("keyword", "swr302")
                        .with(user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].actorId").value(student.getId()))
                .andExpect(jsonPath("$.data.items[0].action").value("UPLOAD_DOCUMENT"));

        mockMvc.perform(get("/api/users/me/activity-logs")
                        .with(user(userDetails(student))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].actorId").value(student.getId()))
                .andExpect(jsonPath("$.data.items[0].action").value("UPLOAD_DOCUMENT"));
    }

    @Test
    void loginEndpointCreatesActivityLog() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "student-be051@fpt.edu.vn",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        ActivityLog log = latestLogByAction(ActivityActionType.LOGIN);
        assertEquals(student.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.USER, log.getTargetType());
        assertEquals(student.getId(), log.getTargetId());
        assertEquals("PASSWORD", log.getMetadata().path("loginMethod").asText());
    }

    @Test
    void uploadEndpointCreatesActivityLog() throws Exception {
        when(storageService.upload(any(), eq(student.getId())))
                .thenReturn(new StorageService.StorageResult(
                        "https://cdn.example.com/notes.txt",
                        "documents/student/notes.txt"));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "SRS content".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("subjectId", subject.getId().toString())
                        .param("title", "SWR302 Upload Notes")
                        .param("description", "Upload test")
                        .with(user(userDetails(student))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("SWR302 Upload Notes"));

        ActivityLog log = latestLogByAction(ActivityActionType.UPLOAD_DOCUMENT);
        assertEquals(student.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.DOCUMENT, log.getTargetType());
        assertEquals("SWR302 Upload Notes", log.getMetadata().path("title").asText());
        assertEquals("txt", log.getMetadata().path("fileType").asText());
    }

    @Test
    void chatMessageEndpointCreatesActivityLog() throws Exception {
        Notebook notebook = notebookRepository.save(Notebook.builder()
                .user(student)
                .subject(subject)
                .title("SWR302 Notebook")
                .build());

        Document document = documentRepository.save(Document.builder()
                .user(student)
                .subject(subject)
                .title("SRS Chapter 1")
                .description("Chat support")
                .fileUrl("https://cdn.example.com/srs.pdf")
                .fileType("pdf")
                .build());

        notebookDocumentRepository.save(NotebookDocument.builder()
                .notebook(notebook)
                .document(document)
                .build());

        documentChunkRepository.save(DocumentChunk.builder()
                .document(document)
                .chunkIndex(0)
                .textContent("Software requirements specification defines functional and non-functional requirements.")
                .sourcePage(12)
                .sourceSection("Introduction")
                .build());

        ChatSession session = chatSessionRepository.save(ChatSession.builder()
                .notebook(notebook)
                .user(student)
                .title("Ask SRS")
                .build());

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(user(userDetails(student)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "What does SRS define?",
                                  "topK": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userMessage.content").value("What does SRS define?"));

        ActivityLog log = latestLogByAction(ActivityActionType.CHAT_AI);
        assertEquals(student.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.CHAT_SESSION, log.getTargetType());
        assertEquals(session.getId(), log.getTargetId());
        assertEquals("What does SRS define?", log.getMetadata().path("questionPreview").asText());
    }

    @Test
    void marketplaceSubmitDocumentCreatesActivityLog() throws Exception {
        Document document = documentRepository.save(Document.builder()
                .user(student)
                .subject(subject)
                .title("Marketplace SRS Notes")
                .description("Ready to publish")
                .fileUrl("https://cdn.example.com/marketplace.pdf")
                .fileType("pdf")
                .processingStatus(ProcessingStatus.SUCCESS)
                .build());

        mockMvc.perform(post("/api/marketplace/documents/{id}/submit", document.getId())
                        .with(user(userDetails(student)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "note": "Please review for marketplace"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.marketStatus").value("PENDING"));

        ActivityLog log = latestLogByAction(ActivityActionType.PUBLISH_MARKETPLACE);
        assertEquals(student.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.DOCUMENT, log.getTargetType());
        assertEquals(document.getId(), log.getTargetId());
        assertTrue(log.getMetadata().path("noteProvided").asBoolean());
    }

    @Test
    void adminCreateSystemConfigCreatesActivityLog() throws Exception {
        mockMvc.perform(post("/api/admin/system-configs")
                        .with(user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "configKey": "ai_chat_daily_limit",
                                  "configValue": "99",
                                  "description": "Daily limit"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.configKey").value("AI_CHAT_DAILY_LIMIT"));

        ActivityLog log = latestLogByAction(ActivityActionType.UPDATE_SYSTEM_CONFIG);
        assertEquals(admin.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.SYSTEM_CONFIG, log.getTargetType());
        assertEquals("CREATE", log.getMetadata().path("operation").asText());
        assertEquals("AI_CHAT_DAILY_LIMIT", log.getMetadata().path("configKey").asText());
    }

    @Test
    void adminGrantCommunityRoleCreatesActivityLog() throws Exception {
        mockMvc.perform(post("/api/admin/community-roles")
                        .with(user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "roleType": "REVIEWER",
                                  "scopeType": "GLOBAL"
                                }
                                """.formatted(student.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.userId").value(student.getId()))
                .andExpect(jsonPath("$.data.roleType").value("REVIEWER"));

        ActivityLog log = latestLogByAction(ActivityActionType.GRANT_COMMUNITY_ROLE);
        assertEquals(admin.getId(), log.getActorUser().getId());
        assertEquals(ActivityTargetType.COMMUNITY_ROLE, log.getTargetType());
        assertEquals(student.getId(), log.getMetadata().path("targetUserId").asLong());
        assertEquals("REVIEWER", log.getMetadata().path("roleType").asText());
    }

    private void saveActivityLog(User actor,
                                 ActivityActionType action,
                                 ActivityTargetType targetType,
                                 Long targetId,
                                 Map<String, Object> metadata,
                                 String searchText) {
        activityLogRepository.save(ActivityLog.builder()
                .actorUser(actor)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .metadata(objectMapper.valueToTree(metadata))
                .searchText(searchText)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private ActivityLog latestLogByAction(ActivityActionType action) {
        return activityLogRepository.findAll().stream()
                .filter(log -> log.getAction() == action)
                .max((left, right) -> left.getCreatedAt().compareTo(right.getCreatedAt()))
                .orElseThrow(() -> new AssertionError("Missing activity log for action " + action));
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
