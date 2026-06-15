package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE017Test {

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
    private JdbcTemplate jdbcTemplate;

    private User owner;
    private User otherUser;
    private Subject subject;
    private Notebook ownerNotebook;
    private Notebook ownerSecondaryNotebook;
    private Notebook otherNotebook;

    @BeforeEach
    void setUp() {
        ensureChatMessagesTable();

        chatSessionRepository.deleteAll();
        notebookRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .email("owner@aistudyhub.com")
                .fullName("Owner User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@aistudyhub.com")
                .fullName("Other User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subject = subjectRepository.save(Subject.builder()
                .code("SWR302")
                .name("Software Requirements")
                .standardSemesterNumber(3)
                .build());

        ownerNotebook = notebookRepository.save(Notebook.builder()
                .user(owner)
                .subject(subject)
                .title("Owner Notebook")
                .build());

        ownerSecondaryNotebook = notebookRepository.save(Notebook.builder()
                .user(owner)
                .subject(subject)
                .title("Owner Secondary Notebook")
                .build());

        otherNotebook = notebookRepository.save(Notebook.builder()
                .user(otherUser)
                .subject(subject)
                .title("Other Notebook")
                .build());
    }

    @Test
    void createSession_Success_WhenNotebookBelongsToCurrentUser() throws Exception {
        String requestBody = """
                {
                  "title": "Ôn tập SRS"
                }
                """;

        mockMvc.perform(post("/api/notebooks/{notebookId}/chat-sessions", ownerNotebook.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Chat session created successfully"))
                .andExpect(jsonPath("$.data.notebookId").value(ownerNotebook.getId()))
                .andExpect(jsonPath("$.data.userId").value(owner.getId()))
                .andExpect(jsonPath("$.data.title").value("Ôn tập SRS"));

        assertEquals(1L, chatSessionRepository.count());
    }

    @Test
    void listSessions_Success_ReturnsOnlySessionsInTargetNotebookWithPagination() throws Exception {
        saveSession(ownerNotebook, owner, "Older Session", LocalDateTime.of(2026, 6, 12, 21, 55));
        saveSession(ownerNotebook, owner, "Newest Session", LocalDateTime.of(2026, 6, 12, 21, 56));
        saveSession(ownerSecondaryNotebook, owner, "Other Notebook Session", LocalDateTime.of(2026, 6, 12, 21, 57));

        mockMvc.perform(get("/api/notebooks/{notebookId}/chat-sessions", ownerNotebook.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].title").value("Newest Session"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(1))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(2));
    }

    @Test
    void listSessions_AccessDenied_WhenNotebookBelongsToAnotherUser() throws Exception {
        mockMvc.perform(get("/api/notebooks/{notebookId}/chat-sessions", otherNotebook.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this notebook"))
                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_ACCESS_DENIED"));
    }

    @Test
    void getSession_Success_WhenOwnerRequestsOwnSession() throws Exception {
        ChatSession session = saveSession(ownerNotebook, owner, "Session Detail", LocalDateTime.of(2026, 6, 12, 22, 0));

        mockMvc.perform(get("/api/chat-sessions/{sessionId}", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(session.getId()))
                .andExpect(jsonPath("$.data.notebookId").value(ownerNotebook.getId()))
                .andExpect(jsonPath("$.data.userId").value(owner.getId()))
                .andExpect(jsonPath("$.data.title").value("Session Detail"));
    }

    @Test
    void getSession_AccessDenied_WhenSessionBelongsToAnotherUser() throws Exception {
        ChatSession session = saveSession(otherNotebook, otherUser, "Private Session", LocalDateTime.of(2026, 6, 12, 22, 5));

        mockMvc.perform(get("/api/chat-sessions/{sessionId}", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this chat session"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_ACCESS_DENIED"));
    }

    @Test
    void getSession_NotFound_WhenSessionDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/chat-sessions/{sessionId}", 99999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chat session not found"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_NOT_FOUND"));
    }

    @Test
    void deleteSession_Success_CascadesToChatMessages() throws Exception {
        ChatSession session = saveSession(ownerNotebook, owner, "Disposable Session", LocalDateTime.of(2026, 6, 12, 22, 10));
        jdbcTemplate.update(
                "INSERT INTO chat_messages (session_id, message_sequence, sender_role, content, cited_sources, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                session.getId(), 1, "USER", "SRS là gì?", "[]", Timestamp.valueOf(LocalDateTime.of(2026, 6, 12, 22, 11))
        );

        mockMvc.perform(delete("/api/chat-sessions/{sessionId}", session.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Deleted successfully"))
                .andExpect(jsonPath("$.data.deleted").value(true));

        assertFalse(chatSessionRepository.existsById(session.getId()));
        Integer remainingMessages = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?",
                Integer.class,
                session.getId()
        );
        assertEquals(0, remainingMessages);
    }

    @Test
    void deleteSession_NotFound_WhenSessionDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/chat-sessions/{sessionId}", 99999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chat session not found"))
                .andExpect(jsonPath("$.errorCode").value("CHAT_SESSION_NOT_FOUND"));
    }

    private void ensureChatMessagesTable() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS chat_messages");
        jdbcTemplate.execute("""
                CREATE TABLE chat_messages (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    session_id BIGINT NOT NULL,
                    message_sequence INT NOT NULL,
                    sender_role VARCHAR(50) NOT NULL,
                    content CLOB NOT NULL,
                    cited_sources CLOB,
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

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
