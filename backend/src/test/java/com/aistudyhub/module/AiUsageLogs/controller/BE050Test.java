package com.aistudyhub.module.AiUsageLogs.controller;

import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.AiUsageLogs;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.ActivityLogRepository;
import com.aistudyhub.repository.AiUsageLogsRepository;
import com.aistudyhub.repository.ChatMessageRepository;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BE050Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AiUsageLogsRepository aiUsageLogsRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NotebookRepository notebookRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private NotebookDocumentRepository notebookDocumentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    private User admin;
    private User student;
    private User otherUser;
    private Subject subject;
    private Notebook studentNotebook;
    private ChatSession studentSession;

    @BeforeEach
    void setUp() {
        cleanupTestData();

        admin = userRepository.save(User.builder()
                .email("admin-be050@aistudyhub.com")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Admin BE050")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        student = userRepository.save(User.builder()
                .email("student-be050@aistudyhub.com")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Student BE050")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other-be050@aistudyhub.com")
                .passwordHash(passwordEncoder.encode("secret123"))
                .fullName("Other BE050")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subject = subjectRepository.save(Subject.builder()
                .code("SWR050")
                .name("Software Requirements")
                .standardSemesterNumber(4)
                .build());

        studentNotebook = notebookRepository.save(Notebook.builder()
                .user(student)
                .subject(subject)
                .title("BE050 Notebook")
                .build());

        studentSession = chatSessionRepository.save(ChatSession.builder()
                .notebook(studentNotebook)
                .user(student)
                .title("BE050 Chat Session")
                .build());

        attachChunkToNotebook(studentNotebook, student, "SRS Notes",
                "Software requirements specification defines functional requirements, constraints, and acceptance criteria.",
                0,
                12);
    }

    @AfterEach
    void tearDown() {
        cleanupTestData();
    }

    @Test
    void myUsage_ReturnsExistingLogsForCurrentUserWithoutFilters() throws Exception {
        saveUsage(student, AiActionType.CHAT, 785, "0.000000",
                LocalDateTime.of(2026, 7, 19, 15, 0, 55));
        saveUsage(student, AiActionType.QUIZ_GENERATION, 1752, "0.000000",
                LocalDateTime.of(2026, 7, 19, 15, 2, 59));

        mockMvc.perform(get("/api/users/me/ai-usage")
                        .with(user(userDetails(student))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(student.getId()))
                .andExpect(jsonPath("$.data.totalRequests").value(2))
                .andExpect(jsonPath("$.data.usedRequests").value(2))
                .andExpect(jsonPath("$.data.totalTokens").value(2537))
                .andExpect(jsonPath("$.data.estimatedTokens").value(2537))
                .andExpect(jsonPath("$.data.estimatedCost").value(0.000000))
                .andExpect(jsonPath("$.data.chatRequests").value(1))
                .andExpect(jsonPath("$.data.summaryRequests").value(0))
                .andExpect(jsonPath("$.data.quizGenerations").value(1))
                .andExpect(jsonPath("$.data.flashcardGenerations").value(0))
                .andExpect(jsonPath("$.data.documentChunkingRequests").value(0))
                .andExpect(jsonPath("$.data.documentEmbeddingRequests").value(0))
                .andExpect(jsonPath("$.data.actionCounts.CHAT").value(1))
                .andExpect(jsonPath("$.data.actionCounts.QUIZ_GENERATION").value(1))
                .andExpect(jsonPath("$.data.dailyUsage[0].date").value("2026-07-19"))
                .andExpect(jsonPath("$.data.dailyUsage[0].totalRequests").value(2))
                .andExpect(jsonPath("$.data.actionUsage.length()").value(2));
    }

    @Test
    void chatAndPracticeGeneration_SaveAiUsageLogsAndUserAnalytics() throws Exception {
        sendMessage(studentSession.getId(), student, """
                {
                  "content": "What does SRS define?",
                  "topK": 2
                }
                """);

        sendMessage(studentSession.getId(), student, """
                {
                  "content": "Hãy tóm tắt tài liệu SRS này",
                  "topK": 2
                }
                """);

        sendMessage(studentSession.getId(), student, """
                {
                  "content": "[QUIZ] Tao cho toi 2 cau hoi ve SRS",
                  "topK": 2,
                  "options": {
                    "numberOfQuestions": 2,
                    "questionType": "SINGLE_CHOICE"
                  }
                }
                """);

        sendMessage(studentSession.getId(), student, """
                {
                  "content": "[FLASHCARD] Tao cho toi 2 the ve SRS",
                  "topK": 2,
                  "options": {
                    "numberOfCards": 2
                  }
                }
                """);

        Map<AiActionType, Long> counts = aiUsageLogsRepository
                .findByUser_IdOrderByCreatedAtDesc(student.getId())
                .stream()
                .peek(log -> assertTrue(log.getTokenCount() > 0))
                .collect(Collectors.groupingBy(AiUsageLogs::getActionType, Collectors.counting()));

        assertEquals(1L, counts.get(AiActionType.CHAT));
        assertEquals(1L, counts.get(AiActionType.SUMMARY));
        assertEquals(1L, counts.get(AiActionType.QUIZ_GENERATION));
        assertEquals(1L, counts.get(AiActionType.FLASHCARD_GENERATION));

        mockMvc.perform(get("/api/users/me/ai-usage")
                        .with(user(userDetails(student))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(student.getId()))
                .andExpect(jsonPath("$.data.totalRequests").value(4))
                .andExpect(jsonPath("$.data.totalTokens").isNumber())
                .andExpect(jsonPath("$.data.estimatedTokens").isNumber())
                .andExpect(jsonPath("$.data.usedRequests").value(4))
                .andExpect(jsonPath("$.data.chatRequests").value(1))
                .andExpect(jsonPath("$.data.summaryRequests").value(1))
                .andExpect(jsonPath("$.data.quizGenerations").value(1))
                .andExpect(jsonPath("$.data.flashcardGenerations").value(1))
                .andExpect(jsonPath("$.data.documentChunkingRequests").value(0))
                .andExpect(jsonPath("$.data.documentEmbeddingRequests").value(0))
                .andExpect(jsonPath("$.data.actionCounts.CHAT").value(1))
                .andExpect(jsonPath("$.data.actionCounts.SUMMARY").value(1))
                .andExpect(jsonPath("$.data.actionCounts.QUIZ_GENERATION").value(1))
                .andExpect(jsonPath("$.data.actionCounts.FLASHCARD_GENERATION").value(1))
                .andExpect(jsonPath("$.data.dailyUsage[0].totalRequests").value(4))
                .andExpect(jsonPath("$.data.actionUsage.length()").value(4));
    }

    @Test
    void adminAnalytics_ReturnsBreakdownAndSupportsFilters() throws Exception {
        saveUsage(student, AiActionType.CHAT, 120, "0.010000",
                LocalDateTime.of(2026, 7, 18, 9, 30));
        saveUsage(student, AiActionType.QUIZ_GENERATION, 300, "0.020000",
                LocalDateTime.of(2026, 7, 18, 10, 0));
        saveUsage(otherUser, AiActionType.FLASHCARD_GENERATION, 200, "0.015000",
                LocalDateTime.of(2026, 7, 18, 11, 0));
        saveUsage(otherUser, AiActionType.SUMMARY, 80, "0.005000",
                LocalDateTime.of(2026, 7, 17, 11, 0));

        mockMvc.perform(get("/api/admin/analytics/ai-usage")
                        .param("from", "2026-07-18")
                        .param("to", "2026-07-18")
                        .with(user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRequests").value(3))
                .andExpect(jsonPath("$.data.totalTokens").value(620))
                .andExpect(jsonPath("$.data.estimatedTokens").value(620))
                .andExpect(jsonPath("$.data.chatRequests").value(1))
                .andExpect(jsonPath("$.data.quizGenerations").value(1))
                .andExpect(jsonPath("$.data.flashcardGenerations").value(1))
                .andExpect(jsonPath("$.data.estimatedCost").value(0.045000))
                .andExpect(jsonPath("$.data.dailyUsage[0].date").value("2026-07-18"))
                .andExpect(jsonPath("$.data.userUsage.length()").value(2))
                .andExpect(jsonPath("$.data.actionCounts.CHAT").value(1))
                .andExpect(jsonPath("$.data.actionCounts.QUIZ_GENERATION").value(1))
                .andExpect(jsonPath("$.data.actionCounts.FLASHCARD_GENERATION").value(1));

        mockMvc.perform(get("/api/admin/analytics/ai-usage")
                        .param("from", "2026-07-18")
                        .param("to", "2026-07-18")
                        .param("userId", student.getId().toString())
                        .param("actionType", "CHAT")
                        .with(user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRequests").value(1))
                .andExpect(jsonPath("$.data.totalTokens").value(120))
                .andExpect(jsonPath("$.data.userUsage[0].userId").value(student.getId()))
                .andExpect(jsonPath("$.data.actionUsage[0].actionType").value("CHAT"));
    }

    @Test
    void analyticsEndpoint_ReturnsBadRequestForInvalidActionType() throws Exception {
        mockMvc.perform(get("/api/users/me/ai-usage")
                        .param("actionType", "WRONG_ACTION")
                        .with(user(userDetails(student))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    private JsonNode sendMessage(Long sessionId, User user, String requestBody) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", sessionId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private AiUsageLogs saveUsage(User user, AiActionType actionType, int tokenCount, String estimatedCost,
                                  LocalDateTime createdAt) {
        AiUsageLogs log = aiUsageLogsRepository.saveAndFlush(AiUsageLogs.builder()
                .user(user)
                .actionType(actionType)
                .tokenCount(tokenCount)
                .estimatedCost(new BigDecimal(estimatedCost))
                .build());
        jdbcTemplate.update("UPDATE ai_usage_logs SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(createdAt), log.getId());
        return log;
    }

    private void attachChunkToNotebook(Notebook notebook, User documentOwner, String title,
                                       String textContent, int chunkIndex, Integer sourcePage) {
        Document document = documentRepository.save(Document.builder()
                .user(documentOwner)
                .subject(subject)
                .title(title)
                .processingStatus(ProcessingStatus.SUCCESS)
                .build());

        notebookDocumentRepository.save(NotebookDocument.builder()
                .notebook(notebook)
                .document(document)
                .build());

        documentChunkRepository.save(DocumentChunk.builder()
                .document(document)
                .chunkIndex(chunkIndex)
                .textContent(textContent)
                .tokenEstimate(60)
                .sourcePage(sourcePage)
                .sourceSection("Section 1")
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }

    private void cleanupTestData() {
        aiUsageLogsRepository.deleteAll();
        activityLogRepository.deleteAll();
        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        documentChunkRepository.deleteAll();
        notebookDocumentRepository.deleteAll();
        documentRepository.deleteAll();
        notebookRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();
    }
}
