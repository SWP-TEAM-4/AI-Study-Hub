package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.enums.*;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE055Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private QuizRepository quizRepository;

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private FlashcardDeckRepository flashcardDeckRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    private User owner;
    private User otherUser;
    private Subject subject;
    private Notebook ownerNotebook;
    private Notebook otherNotebook;
    private ChatSession ownerSession;
    private Document ownerDocument;
    private Document otherDocument;

    @BeforeEach
    void setUp() {
        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        flashcardRepository.deleteAll();
        flashcardDeckRepository.deleteAll();
        documentChunkRepository.deleteAll();
        notebookDocumentRepository.deleteAll();
        documentRepository.deleteAll();
        notebookRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .email("owner-be055@aistudyhub.com")
                .fullName("Owner User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other-be055@aistudyhub.com")
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

        ownerSession = chatSessionRepository.save(ChatSession.builder()
                .notebook(ownerNotebook)
                .user(owner)
                .title("Owner Chat Session")
                .build());

        ownerDocument = attachChunkToNotebook(ownerNotebook, owner, "Owner Notes",
                "Software requirements specification describes the system behavior and constraints.", 0, 12);

        otherDocument = attachChunkToNotebook(otherNotebook, otherUser, "Other Notes",
                "Foreign notebook content should not be accessible.", 0, 4);
    }

    @Test
    void quizPractice_CreateNew_ImportsSuccessfully() throws Exception {
        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] Tao cho toi 2 cau trac nghiem chuong 1",
                  "topK": 8,
                  "language": "vi",
                  "options": {
                    "numberOfQuestions": 2,
                    "questionType": "SINGLE_CHOICE",
                    "difficulty": "MEDIUM"
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        mockMvc.perform(get("/api/chat-messages/{messageId}/practice-draft", aiMessageId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type").value("QUIZ"))
                .andExpect(jsonPath("$.data.questions.length()").value(2));

        JsonNode importResponse = importDraft(aiMessageId, owner, """
                {
                  "targetMode": "CREATE_NEW",
                  "target": {
                    "title": "Quiz chuong 1",
                    "description": "Quiz tao tu Chat AI"
                  },
                  "importOptions": {
                    "skipDuplicateQuestions": true,
                    "shuffleQuestions": false
                  }
                }
                """, status().isOk());

        long createdQuizId = importResponse.path("data").path("createdQuizId").asLong();
        assertEquals(2, quizQuestionRepository.findByQuizIdOrderById(createdQuizId).size());

        ChatMessage aiMessage = chatMessageRepository.findById(aiMessageId).orElseThrow();
        assertEquals(PracticeStatus.IMPORTED, aiMessage.getPracticeStatus());
        assertEquals(createdQuizId, aiMessage.getImportedTargetId());
    }

    @Test
    void quizPractice_AppendExisting_ImportsSuccessfully() throws Exception {
        Quiz existingQuiz = quizRepository.save(Quiz.builder()
                .creator(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Existing Quiz")
                .description("Existing")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] Tao cho toi 2 cau trac nghiem append",
                  "topK": 8,
                  "options": {
                    "numberOfQuestions": 2,
                    "questionType": "SINGLE_CHOICE"
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        JsonNode importResponse = importDraft(aiMessageId, owner, """
                {
                  "targetMode": "APPEND_EXISTING",
                  "target": {
                    "quizId": %d
                  },
                  "importOptions": {
                    "skipDuplicateQuestions": false
                  }
                }
                """.formatted(existingQuiz.getId()), status().isOk());

        assertEquals(existingQuiz.getId(), importResponse.path("data").path("targetId").asLong());
        assertEquals(2, importResponse.path("data").path("createdQuestions").asInt());
        assertEquals(2, quizQuestionRepository.findByQuizIdOrderById(existingQuiz.getId()).size());
    }

    @Test
    void flashcardPractice_CreateNew_ImportsSuccessfully() throws Exception {
        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[FLASHCARD] Tao cho toi 3 flashcard chuong 1",
                  "topK": 8,
                  "options": {
                    "numberOfCards": 3,
                    "difficulty": "MEDIUM"
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        mockMvc.perform(get("/api/chat-messages/{messageId}/practice-draft", aiMessageId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type").value("FLASHCARD"))
                .andExpect(jsonPath("$.data.cards.length()").value(3));

        JsonNode importResponse = importDraft(aiMessageId, owner, """
                {
                  "targetMode": "CREATE_NEW",
                  "target": {
                    "title": "Flashcard chuong 1"
                  },
                  "importOptions": {
                    "skipDuplicateCards": true
                  }
                }
                """, status().isOk());

        long createdDeckId = importResponse.path("data").path("createdDeckId").asLong();
        FlashcardDeck createdDeck = flashcardDeckRepository.findById(createdDeckId).orElseThrow();
        assertEquals(3, createdDeck.getCards().size());
    }

    @Test
    void flashcardPractice_AppendExisting_ImportsSuccessfully() throws Exception {
        FlashcardDeck existingDeck = flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Existing Deck")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[FLASHCARD] Tao cho toi 2 the append",
                  "topK": 8,
                  "options": {
                    "numberOfCards": 2
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        JsonNode importResponse = importDraft(aiMessageId, owner, """
                {
                  "targetMode": "APPEND_EXISTING",
                  "target": {
                    "deckId": %d
                  },
                  "importOptions": {
                    "skipDuplicateCards": false
                  }
                }
                """.formatted(existingDeck.getId()), status().isOk());

        assertEquals(existingDeck.getId(), importResponse.path("data").path("targetId").asLong());
        FlashcardDeck reloadedDeck = flashcardDeckRepository.findById(existingDeck.getId()).orElseThrow();
        assertEquals(2, reloadedDeck.getCards().size());
    }

    @Test
    void practice_InvalidPrefix_ReturnsBadRequestWithoutSavingMessages() throws Exception {
        sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZZ] Tao cho toi 2 cau hoi"
                }
                """, status().isBadRequest());

        assertEquals(0L, chatMessageRepository.count());
    }

    @Test
    void practice_DocumentIdOutsideNotebook_ReturnsForbidden() throws Exception {
        sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] Tao cho toi 2 cau hoi",
                  "documentIds": [%d]
                }
                """.formatted(otherDocument.getId()), status().isForbidden());

        assertEquals(0L, chatMessageRepository.count());
    }

    @Test
    void previewPracticeDraft_BadRequest_WhenMessageIsNotPracticeDraft() throws Exception {
        JsonNode normalChatResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "SRS la gi?"
                }
                """, status().isOk());

        long aiMessageId = normalChatResponse.path("data").path("aiMessage").path("id").asLong();
        mockMvc.perform(get("/api/chat-messages/{messageId}/practice-draft", aiMessageId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("CHAT_MESSAGE_NOT_PRACTICE_DRAFT"));
    }

    @Test
    void importPracticeDraft_Conflict_WhenAlreadyImported() throws Exception {
        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] Tao cho toi 1 cau hoi import lai",
                  "options": {
                    "numberOfQuestions": 1,
                    "questionType": "SINGLE_CHOICE"
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        importDraft(aiMessageId, owner, """
                {
                  "targetMode": "CREATE_NEW",
                  "target": {
                    "title": "Quiz chi import mot lan"
                  }
                }
                """, status().isOk());

        importDraft(aiMessageId, owner, """
                {
                  "targetMode": "CREATE_NEW",
                  "target": {
                    "title": "Quiz import lai"
                  }
                }
                """, status().isConflict());
    }

    @Test
    void practiceDraft_FailedStatus_WhenSchemaInvalid() throws Exception {
        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] TRIGGER_SCHEMA_INVALID"
                }
                """, status().isOk());

        assertEquals("FAILED", sendResponse.path("data").path("aiMessage").path("practiceStatus").asText());
        assertFalse(sendResponse.path("data").path("aiMessage").path("validationErrors").isMissingNode());
        assertEquals(2L, chatMessageRepository.count());
    }

    @Test
    void practiceDraft_RepairsMalformedJson_AndReturnsReady() throws Exception {
        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] TRIGGER_INVALID_JSON",
                  "options": {
                    "numberOfQuestions": 2,
                    "questionType": "SINGLE_CHOICE"
                  }
                }
                """, status().isOk());

        assertEquals("READY", sendResponse.path("data").path("aiMessage").path("practiceStatus").asText());
        assertEquals("QUIZ", sendResponse.path("data").path("aiMessage").path("generatedPayload").path("type").asText());
        assertEquals(2, sendResponse.path("data").path("aiMessage").path("generatedPayload").path("questions").size());
    }

    @Test
    void quizPractice_SkipDuplicateQuestions_SkipsAndImportsRemaining() throws Exception {
        Quiz existingQuiz = quizRepository.save(Quiz.builder()
                .creator(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Duplicate Quiz")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        quizQuestionRepository.save(QuizQuestion.builder()
                .quiz(existingQuiz)
                .questionText("Cau hoi AI 1 tu Owner Notes")
                .questionType(QuestionType.SINGLE_CHOICE)
                .explanation("Existing duplicate")
                .build());

        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[QUIZ] Tao cho toi 2 cau hoi duplicate",
                  "options": {
                    "numberOfQuestions": 2,
                    "questionType": "SINGLE_CHOICE"
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        JsonNode importResponse = importDraft(aiMessageId, owner, """
                {
                  "targetMode": "APPEND_EXISTING",
                  "target": {
                    "quizId": %d
                  },
                  "importOptions": {
                    "skipDuplicateQuestions": true
                  }
                }
                """.formatted(existingQuiz.getId()), status().isOk());

        assertEquals(1, importResponse.path("data").path("createdQuestions").asInt());
        assertEquals(1, importResponse.path("data").path("skippedDuplicates").asInt());
        assertEquals(2, quizQuestionRepository.findByQuizIdOrderById(existingQuiz.getId()).size());
    }

    @Test
    void flashcardPractice_DuplicateCards_RollbackWhenSkipDisabled() throws Exception {
        FlashcardDeck existingDeck = flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Duplicate Deck")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        flashcardRepository.save(Flashcard.builder()
                .deck(existingDeck)
                .frontText("The AI 1")
                .backText("Existing duplicate")
                .build());

        JsonNode sendResponse = sendMessage(ownerSession.getId(), owner, """
                {
                  "content": "[FLASHCARD] Tao cho toi 2 the duplicate",
                  "options": {
                    "numberOfCards": 2
                  }
                }
                """, status().isOk());

        long aiMessageId = sendResponse.path("data").path("aiMessage").path("id").asLong();
        importDraft(aiMessageId, owner, """
                {
                  "targetMode": "APPEND_EXISTING",
                  "target": {
                    "deckId": %d
                  },
                  "importOptions": {
                    "skipDuplicateCards": false
                  }
                }
                """.formatted(existingDeck.getId()), status().isConflict());

        assertEquals(1, flashcardRepository.findByDeckIdOrderById(existingDeck.getId()).size());
    }

    @Test
    void legacyQuizQuestionApi_StillWorks() throws Exception {
        Quiz quiz = quizRepository.save(Quiz.builder()
                .creator(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Legacy Quiz")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionText": "Spring Boot la gi?",
                                  "questionType": "SINGLE_CHOICE",
                                  "explanation": "Framework Java",
                                  "options": [
                                    { "optionText": "Framework Java", "isCorrect": true },
                                    { "optionText": "Database", "isCorrect": false }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.questionText").value("Spring Boot la gi?"));

        assertEquals(1, quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).size());
    }

    @Test
    void legacyFlashcardCardApi_StillWorks() throws Exception {
        FlashcardDeck deck = flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(owner)
                .notebook(ownerNotebook)
                .subject(subject)
                .title("Legacy Deck")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        mockMvc.perform(post("/api/flashcard-decks/{deckId}/cards", deck.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "frontText": "HTTP",
                                  "backText": "HyperText Transfer Protocol"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cards.length()").value(1));

        assertEquals(1, flashcardRepository.findByDeckIdOrderById(deck.getId()).size());
    }

    private JsonNode sendMessage(Long sessionId, User user, String requestBody,
                                 org.springframework.test.web.servlet.ResultMatcher expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chat-sessions/{sessionId}/messages", sessionId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(expectedStatus)
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode importDraft(Long messageId, User user, String requestBody,
                                 org.springframework.test.web.servlet.ResultMatcher expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chat-messages/{messageId}/practice-import", messageId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(expectedStatus)
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private Document attachChunkToNotebook(Notebook notebook, User documentOwner, String title,
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

        return document;
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
