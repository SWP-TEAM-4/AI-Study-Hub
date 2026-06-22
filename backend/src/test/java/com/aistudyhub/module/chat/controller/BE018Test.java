package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE018Test {

    @Autowired
    private MockMvc mockMvc;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User owner;
    private User otherUser;
    private Subject subject;
    private Notebook ownerNotebook;
    private Notebook otherNotebook;

    @BeforeEach
    void setUp() {
        ensureChatMessagesTable();

        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        documentChunkRepository.deleteAll();
        notebookDocumentRepository.deleteAll();
        documentRepository.deleteAll();
        notebookRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .email("owner-be018@aistudyhub.com")
                .fullName("Owner User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other-be018@aistudyhub.com")
                .fullName("Other User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subject = subjectRepository.save(Subject.builder()
                .code("SWR391")
                .name("Software Engineering")
                .standardSemesterNumber(6)
                .build());

        ownerNotebook = notebookRepository.save(Notebook.builder()
                .user(owner)
                .subject(subject)
                .title("Owner Notebook")
                .build());

        otherNotebook = notebookRepository.save(Notebook.builder()
                .user(otherUser)
                .subject(subject)
                .title("Other Notebook")
                .build());
    }

    @Test
    void sendMessage_Success_SavesUserAndAiMessagesWithCitations() throws Exception {
        ChatSession session = saveSession(ownerNotebook, owner, "SRS Session", LocalDateTime.of(2026, 6, 15, 10, 0));
        attachChunkToNotebook(ownerNotebook, owner,
                "SRS Notes",
                "Software requirements specification defines functional requirements, non-functional requirements, constraints and acceptance criteria.",
                0,
                12);

        String requestBody = """
                {
                  "content": "What does software requirements specification define?",
                  "topK": 3
                }
                """;

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.userMessage.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.data.userMessage.messageSequence").value(1))
                .andExpect(jsonPath("$.data.userMessage.senderRole").value("USER"))
                .andExpect(jsonPath("$.data.aiMessage.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.data.aiMessage.messageSequence").value(2))
                .andExpect(jsonPath("$.data.aiMessage.senderRole").value("AI"))
                .andExpect(jsonPath("$.data.aiMessage.citedSources[0].documentTitle").value("SRS Notes"))
                .andExpect(jsonPath("$.data.aiMessage.citedSources[0].documentId").isNumber())
                .andExpect(jsonPath("$.data.aiMessage.citedSources[0].chunkIndex").value(0))
                .andExpect(jsonPath("$.data.aiMessage.citedSources[0].sourcePage").value(12));

        assertEquals(2L, chatMessageRepository.count());
        String citedSourcesJson = jdbcTemplate.queryForObject(
                "SELECT cited_sources FROM chat_messages WHERE session_id = ? AND sender_role = 'AI'",
                String.class,
                session.getId()
        );
        assertTrue(citedSourcesJson.contains("\"documentId\""));
        assertTrue(citedSourcesJson.contains("\"chunkIndex\":0"));
    }

    @Test
    void listMessages_Success_ReturnsMessagesInAscendingSequenceAcrossMultipleTurns() throws Exception {
        ChatSession session = saveSession(ownerNotebook, owner, "Conversation Session", LocalDateTime.of(2026, 6, 15, 10, 5));
        attachChunkToNotebook(ownerNotebook, owner,
                "Glossary",
                "The software requirements specification captures scope, requirements, constraints and acceptance criteria for the system.",
                0,
                8);

        sendQuestion(session.getId(), owner, "What does the software requirements specification capture?");
        sendQuestion(session.getId(), owner, "What does the specification include?");

        mockMvc.perform(get("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(4))
                .andExpect(jsonPath("$.data[0].messageSequence").value(1))
                .andExpect(jsonPath("$.data[0].senderRole").value("USER"))
                .andExpect(jsonPath("$.data[1].messageSequence").value(2))
                .andExpect(jsonPath("$.data[1].senderRole").value("AI"))
                .andExpect(jsonPath("$.data[2].messageSequence").value(3))
                .andExpect(jsonPath("$.data[2].senderRole").value("USER"))
                .andExpect(jsonPath("$.data[3].messageSequence").value(4))
                .andExpect(jsonPath("$.data[3].senderRole").value("AI"));

        List<Integer> sequences = chatMessageRepository.findBySessionIdOrderByMessageSequenceAsc(session.getId()).stream()
                .map(ChatMessage::getMessageSequence)
                .toList();
        assertEquals(List.of(1, 2, 3, 4), sequences);
    }

    @Test
    void sendMessage_FallbackAnswer_WhenNotebookHasNoRelevantChunks() throws Exception {
        ChatSession session = saveSession(ownerNotebook, owner, "Empty Session", LocalDateTime.of(2026, 6, 15, 10, 10));

        String requestBody = """
                {
                  "content": "Explain domain driven design"
                }
                """;

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.aiMessage.senderRole").value("AI"))
                .andExpect(jsonPath("$.data.aiMessage.citedSources.length()").value(0))
                .andExpect(jsonPath("$.data.aiMessage.content").value(org.hamcrest.Matchers.containsString("Mình chưa tìm thấy đoạn tài liệu phù hợp")));
    }

    @Test
    void sendMessage_AccessDenied_WhenSessionBelongsToAnotherUser() throws Exception {
        ChatSession session = saveSession(otherNotebook, otherUser, "Private Session", LocalDateTime.of(2026, 6, 15, 10, 15));

        String requestBody = """
                {
                  "content": "What is hidden here?"
                }
                """;

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this chat session"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_ACCESS_DENIED"));
    }

    @Test
    void listMessages_AccessDenied_WhenSessionBelongsToAnotherUser() throws Exception {
        ChatSession session = saveSession(otherNotebook, otherUser, "Other Session", LocalDateTime.of(2026, 6, 15, 10, 20));

        mockMvc.perform(get("/api/chat-sessions/{sessionId}/messages", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this chat session"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_ACCESS_DENIED"));
    }

    @Test
    void sendAndListMessages_NotFound_WhenSessionDoesNotExist() throws Exception {
        String requestBody = """
                {
                  "content": "Hello?"
                }
                """;

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", 99999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chat session not found"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_NOT_FOUND"));

        mockMvc.perform(get("/api/chat-sessions/{sessionId}/messages", 99999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chat session not found"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_NOT_FOUND"));
    }

    private void sendQuestion(Long sessionId, User user, String question) throws Exception {
        String requestBody = """
                {
                  "content": "%s",
                  "topK": 2
                }
                """.formatted(question);

        mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", sessionId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    private void ensureChatMessagesTable() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS chat_messages");
        jdbcTemplate.execute("""
                CREATE TABLE chat_messages (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    session_id BIGINT NOT NULL,
                    message_sequence INT NOT NULL,
                    sender_role VARCHAR(50) NOT NULL,
                    message_type VARCHAR(50) DEFAULT 'TEXT' NOT NULL,
                    practice_type VARCHAR(30),
                    content CLOB NOT NULL,
                    cited_sources CLOB,
                    generated_payload JSON,
                    validation_errors JSON,
                    practice_status VARCHAR(30) DEFAULT 'NONE' NOT NULL,
                    imported_target_type VARCHAR(30),
                    imported_target_id BIGINT,
                    imported_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_chat_messages_session
                        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
                )
                """);
    }

    private ChatSession saveSession(Notebook notebook, User user, String title, LocalDateTime createdAt) {
        ChatSession session = chatSessionRepository.save(ChatSession.builder()
                .notebook(notebook)
                .user(user)
                .title(title)
                .build());

        jdbcTemplate.update("UPDATE chat_sessions SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(createdAt), session.getId());
        return chatSessionRepository.findById(session.getId()).orElseThrow();
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
                .tokenEstimate(40)
                .sourcePage(sourcePage)
                .sourceSection("Section 1")
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
