package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
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

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE027Test {

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
        private QuizQuestionRepository quizQuestionRepository;

        @Autowired
        private FlashcardDeckRepository flashcardDeckRepository;

        private User currentUser;
        private User otherUser;
        private Subject subject;

        @BeforeEach
        void setUp() {
                // Clear database in correct order
                quizQuestionRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                quizRepository.deleteAll();
                documentRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // Seed users
                currentUser = userRepository.save(User.builder()
                                .email("student1@fpt.edu.vn")
                                .fullName("Current User")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                otherUser = userRepository.save(User.builder()
                                .email("student2@fpt.edu.vn")
                                .fullName("Other User")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // Seed subject
                subject = subjectRepository.save(Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build());
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // ==========================================
        // DOCUMENT SUBMISSION TESTS
        // ==========================================

        @Test
        void submitDocument_Success_ShouldPublishToMarketplace() throws Exception {
                Document document = documentRepository.save(Document.builder()
                                .user(currentUser)
                                .subject(subject)
                                .title("Chapter 10 Requirement Specification")
                                .description("Slide SWR302 chương 10")
                                .fileUrl("/uploads/documents/chapter10.pdf")
                                .cloudFilePath("documents/1/chapter10.pdf")
                                .fileType("pdf")
                                .fileSize(2457600L)
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build());

                mockMvc.perform(post("/api/marketplace/documents/{id}/submit", document.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"note\": \"Submit for marketplace review\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Document submitted successfully to marketplace."))
                                .andExpect(jsonPath("$.data.id").value(document.getId()))
                                .andExpect(jsonPath("$.data.visibility").value("MARKETPLACE"))
                                .andExpect(jsonPath("$.data.marketStatus").value("PENDING"));

                Document updated = documentRepository.findById(document.getId()).orElseThrow();
                assertEquals(Visibility.MARKETPLACE, updated.getVisibility());
                assertEquals(MarketStatus.PENDING, updated.getMarketStatus());
        }

        @Test
        void submitDocument_Forbidden_WhenNotOwner() throws Exception {
                Document document = documentRepository.save(Document.builder()
                                .user(otherUser)
                                .subject(subject)
                                .title("Chapter 10 Requirement Specification")
                                .description("Slide SWR302")
                                .fileUrl("/uploads/documents/chapter10.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .build());

                mockMvc.perform(post("/api/marketplace/documents/{id}/submit", document.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_ACCESS_DENIED"));
        }

        @Test
        void submitDocument_NotFound_WhenDocDoesNotExist() throws Exception {
                mockMvc.perform(post("/api/marketplace/documents/{id}/submit", 9999L)
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
        }

        @Test
        void submitDocument_ValidationError_WhenMissingSubject() throws Exception {
                Document document = documentRepository.save(Document.builder()
                                .user(currentUser)
                                .subject(null) // missing subject
                                .title("Chapter 10 Requirement Specification")
                                .description("Slide SWR302")
                                .fileUrl("/uploads/documents/chapter10.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .build());

                mockMvc.perform(post("/api/marketplace/documents/{id}/submit", document.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message").value(
                                                "Subject is required to publish this document to the marketplace."));
        }

        @Test
        void submitDocument_ValidationError_WhenProcessingNotSuccessful() throws Exception {
                Document document = documentRepository.save(Document.builder()
                                .user(currentUser)
                                .subject(subject)
                                .title("Chapter 10 Requirement Specification")
                                .description("Slide SWR302")
                                .fileUrl("/uploads/documents/chapter10.pdf")
                                .processingStatus(ProcessingStatus.PENDING) // not SUCCESS
                                .build());

                mockMvc.perform(post("/api/marketplace/documents/{id}/submit", document.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message").value("Document processing is not successful yet."));
        }

        // ==========================================
        // QUIZ SUBMISSION TESTS
        // ==========================================

        @Test
        void submitQuiz_Success_ShouldPublishToMarketplace() throws Exception {
                Quiz quiz = quizRepository.save(Quiz.builder()
                                .creator(currentUser)
                                .subject(subject)
                                .title("SWR302 Quiz Chapter 10")
                                .description("Quiz ôn tập SRS")
                                .examType("PRACTICE")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build());

                // add a question to satisfy quiz validation
                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(quiz)
                                .questionText("What is SRS?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                mockMvc.perform(post("/api/marketplace/quizzes/{id}/submit", quiz.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"note\": \"Submit quiz\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.id").value(quiz.getId()))
                                .andExpect(jsonPath("$.data.visibility").value("MARKETPLACE"))
                                .andExpect(jsonPath("$.data.marketStatus").value("PENDING"));

                Quiz updated = quizRepository.findById(quiz.getId()).orElseThrow();
                assertEquals(Visibility.MARKETPLACE, updated.getVisibility());
                assertEquals(MarketStatus.PENDING, updated.getMarketStatus());
        }

        @Test
        void submitQuiz_ValidationError_WhenReviewNoteIsMissing() throws Exception {
                Quiz quiz = quizRepository.save(Quiz.builder()
                                .creator(currentUser)
                                .subject(subject)
                                .title("SWR302 Quiz With No Review Note")
                                .description("Quiz has complete metadata")
                                .examType("PRACTICE")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build());

                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(quiz)
                                .questionText("What is a review note?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                mockMvc.perform(post("/api/marketplace/quizzes/{id}/submit", quiz.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message").value("Review note is required"));
        }

        @Test
        void submitQuiz_Forbidden_WhenNotOwner() throws Exception {
                Quiz quiz = quizRepository.save(Quiz.builder()
                                .creator(otherUser)
                                .subject(subject)
                                .title("SWR302 Quiz Chapter 10")
                                .description("Quiz")
                                .examType("PRACTICE")
                                .build());

                mockMvc.perform(post("/api/marketplace/quizzes/{id}/submit", quiz.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("QUIZ_ACCESS_DENIED"));
        }

        @Test
        void submitQuiz_ValidationError_WhenNoQuestions() throws Exception {
                Quiz quiz = quizRepository.save(Quiz.builder()
                                .creator(currentUser)
                                .subject(subject)
                                .title("SWR302 Quiz Chapter 10")
                                .description("Quiz")
                                .examType("PRACTICE")
                                .build());

                // quizQuestionRepository remains empty for this quiz

                mockMvc.perform(post("/api/marketplace/quizzes/{id}/submit", quiz.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message").value("Quiz must contain at least one question."));
        }

        // ==========================================
        // FLASHCARD DECK SUBMISSION TESTS
        // ==========================================

        @Test
        void submitFlashcardDeck_Success_ShouldPublishToMarketplace() throws Exception {
                FlashcardDeck deck = FlashcardDeck.builder()
                                .user(currentUser)
                                .subject(subject)
                                .title("SWR302 Key Terms")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build();

                Flashcard card = Flashcard.builder()
                                .deck(deck)
                                .frontText("SRS")
                                .backText("Software Requirements Specification")
                                .build();
                deck.getCards().add(card);

                FlashcardDeck savedDeck = flashcardDeckRepository.save(deck);

                mockMvc.perform(post("/api/marketplace/flashcard-decks/{id}/submit", savedDeck.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"note\": \"Submit deck\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.id").value(savedDeck.getId()))
                                .andExpect(jsonPath("$.data.visibility").value("MARKETPLACE"))
                                .andExpect(jsonPath("$.data.marketStatus").value("PENDING"));

                FlashcardDeck updated = flashcardDeckRepository.findById(savedDeck.getId()).orElseThrow();
                assertEquals(Visibility.MARKETPLACE, updated.getVisibility());
                assertEquals(MarketStatus.PENDING, updated.getMarketStatus());
        }

        @Test
        void submitFlashcardDeck_ValidationError_WhenReviewNoteIsMissing() throws Exception {
                FlashcardDeck deck = FlashcardDeck.builder()
                                .user(currentUser)
                                .subject(subject)
                                .title("SWR302 Cards With No Review Note")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build();

                deck.getCards().add(Flashcard.builder()
                                .deck(deck)
                                .frontText("Reviewer")
                                .backText("A person who checks submitted content")
                                .build());
                FlashcardDeck savedDeck = flashcardDeckRepository.save(deck);

                mockMvc.perform(post("/api/marketplace/flashcard-decks/{id}/submit", savedDeck.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message").value("Review note is required"));
        }

        @Test
        void submitFlashcardDeck_ValidationError_WhenNoCards() throws Exception {
                FlashcardDeck deck = flashcardDeckRepository.save(FlashcardDeck.builder()
                                .user(currentUser)
                                .subject(subject)
                                .title("SWR302 Key Terms")
                                .cards(new ArrayList<>())
                                .build());

                mockMvc.perform(post("/api/marketplace/flashcard-decks/{id}/submit", deck.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                                .andExpect(jsonPath("$.message")
                                                .value("Flashcard deck must contain at least one card."));
        }
}
