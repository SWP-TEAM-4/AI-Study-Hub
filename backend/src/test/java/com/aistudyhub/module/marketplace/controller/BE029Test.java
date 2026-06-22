package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.module.marketplace.dto.MarketplaceCloneRequest;
import com.aistudyhub.module.marketplace.dto.MarketplaceSubmitRequest;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Lớp kiểm thử tích hợp (Integration Test) cho các API nhân bản (Clone) tài
 * nguyên từ Chợ về cá nhân.
 * Task: BE-029
 * Kiểm tra các tính năng:
 * - Clone thành công (lưu cloned_from_id, tăng downloadCount)
 * - Chặn re-publish tài nguyên đã clone.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE029Test {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

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
        private QuizOptionRepository quizOptionRepository;

        @Autowired
        private FlashcardDeckRepository flashcardDeckRepository;

        @Autowired
        private NotebookRepository notebookRepository;

        @Autowired
        private NotebookDocumentRepository notebookDocumentRepository;

        private User ownerUser;
        private User clonerUser;
        private User otherUser;
        private Subject subjectSWR;
        private Notebook clonerNotebook;
        private Notebook otherNotebook;

        private Document publicDoc;
        private Document privateDoc;
        private Quiz publicQuiz;
        private FlashcardDeck publicDeck;

        @BeforeEach
        void setUp() {
                // Xóa sạch cơ sở dữ liệu theo đúng thứ tự ràng buộc khóa ngoại để tránh xung
                // đột dữ liệu
                notebookDocumentRepository.deleteAll();
                notebookRepository.deleteAll();
                quizOptionRepository.deleteAll();
                quizQuestionRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                quizRepository.deleteAll();
                documentRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed dữ liệu người dùng
                ownerUser = userRepository.save(User.builder()
                                .email("owner.test@fpt.edu.vn")
                                .fullName("Nguyen Van Owner")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                clonerUser = userRepository.save(User.builder()
                                .email("cloner.test@fpt.edu.vn")
                                .fullName("Tran Van Cloner")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                otherUser = userRepository.save(User.builder()
                                .email("other.test@fpt.edu.vn")
                                .fullName("Le Thi Other")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // 2. Seed dữ liệu môn học
                subjectSWR = subjectRepository.save(Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build());

                // 3. Seed dữ liệu Notebooks cho cloner và other
                clonerNotebook = notebookRepository.save(Notebook.builder()
                                .user(clonerUser)
                                .subject(subjectSWR)
                                .title("Cloner's Notebook")
                                .build());

                otherNotebook = notebookRepository.save(Notebook.builder()
                                .user(otherUser)
                                .subject(subjectSWR)
                                .title("Other's Notebook")
                                .build());

                // 4. Seed tài liệu công khai trên chợ (APPROVED)
                publicDoc = documentRepository.save(Document.builder()
                                .user(ownerUser)
                                .subject(subjectSWR)
                                .title("SRS Document")
                                .description("Software Requirement Specification guide")
                                .fileUrl("/uploads/srs.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(5)
                                .build());

                // 5. Seed tài liệu riêng tư (PRIVATE)
                privateDoc = documentRepository.save(Document.builder()
                                .user(ownerUser)
                                .subject(subjectSWR)
                                .title("Draft Document")
                                .description("Private draft document")
                                .fileUrl("/uploads/draft.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build());

                // 6. Seed Quiz công khai trên chợ
                publicQuiz = quizRepository.save(Quiz.builder()
                                .creator(ownerUser)
                                .subject(subjectSWR)
                                .title("Agile Scrum Quiz")
                                .description("Test your Agile knowledge")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(10)
                                .build());

                // Tạo câu hỏi và đáp án cho Quiz công khai bằng cascade để đồng bộ hai chiều
                // trong bộ nhớ JPA
                QuizQuestion q1 = QuizQuestion.builder()
                                .quiz(publicQuiz)
                                .questionText("What is Sprint?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .explanation("Sprint is a timeboxed iteration.")
                                .options(new ArrayList<>())
                                .build();

                q1.getOptions().add(QuizOption.builder()
                                .question(q1)
                                .optionText("A timeboxed iteration")
                                .isCorrect(true)
                                .build());

                q1.getOptions().add(QuizOption.builder()
                                .question(q1)
                                .optionText("A sprint running race")
                                .isCorrect(false)
                                .build());

                quizQuestionRepository.save(q1);

                // 7. Seed FlashcardDeck công khai trên chợ
                publicDeck = FlashcardDeck.builder()
                                .user(ownerUser)
                                .subject(subjectSWR)
                                .title("Design Pattern Cards")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(3)
                                .cards(new ArrayList<>())
                                .build();

                publicDeck.getCards().add(Flashcard.builder()
                                .deck(publicDeck)
                                .frontText("Singleton Pattern")
                                .backText("Only one instance of a class")
                                .build());

                publicDeck.getCards().add(Flashcard.builder()
                                .deck(publicDeck)
                                .frontText("Observer Pattern")
                                .backText("One-to-many dependency notification")
                                .build());

                flashcardDeckRepository.save(publicDeck);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // ==========================================
        // INTEGRATION TESTS CHO CLONE DOCUMENT
        // ==========================================

        @Test
        void cloneDocument_Success_WithoutNotebook() throws Exception {
                mockMvc.perform(post("/api/marketplace/documents/" + publicDoc.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Document cloned successfully from marketplace."))
                                .andExpect(jsonPath("$.data.title").value("SRS Document"))
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"))
                                .andExpect(jsonPath("$.data.marketStatus").value("NONE"))
                                .andExpect(jsonPath("$.data.clonedFromId").value(publicDoc.getId()));

                // Kiểm tra database: xem bản sao mới có được tạo đúng cho clonerUser không
                List<Document> clonerDocs = documentRepository.findAll().stream()
                                .filter(d -> d.getUser().getId().equals(clonerUser.getId()))
                                .toList();
                assertEquals(1, clonerDocs.size());
                assertEquals("SRS Document", clonerDocs.get(0).getTitle());
                assertEquals(Visibility.PRIVATE, clonerDocs.get(0).getVisibility());
                assertNotNull(clonerDocs.get(0).getClonedFrom());
                assertEquals(publicDoc.getId(), clonerDocs.get(0).getClonedFrom().getId());

                // Kiểm tra downloadCount của document gốc phải tăng lên 1 (5 -> 6)
                Document updatedOriginal = documentRepository.findById(publicDoc.getId()).orElseThrow();
                assertEquals(6, updatedOriginal.getDownloadCount());
        }

        @Test
        void cloneDocument_Success_WithNotebook() throws Exception {
                MarketplaceCloneRequest request = MarketplaceCloneRequest.builder()
                                .targetNotebookId(clonerNotebook.getId())
                                .build();

                mockMvc.perform(post("/api/marketplace/documents/" + publicDoc.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                // Kiểm tra liên kết trong notebook_documents
                List<NotebookDocument> links = notebookDocumentRepository.findAll().stream()
                                .filter(link -> link.getNotebook().getId().equals(clonerNotebook.getId()))
                                .toList();
                assertEquals(1, links.size());
                assertEquals("SRS Document", links.get(0).getDocument().getTitle());
        }

        @Test
        void cloneDocument_Fail_NotebookAccessDenied() throws Exception {
                MarketplaceCloneRequest request = MarketplaceCloneRequest.builder()
                                .targetNotebookId(otherNotebook.getId()) // Notebook của người khác
                                .build();

                mockMvc.perform(post("/api/marketplace/documents/" + publicDoc.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value("You don't have access to this notebook"));
        }

        @Test
        void cloneDocument_Fail_NotApproved() throws Exception {
                mockMvc.perform(post("/api/marketplace/documents/" + privateDoc.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isNotFound()) // CONTENT_NOT_MARKETPLACE trả về NOT_FOUND
                                .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        void cloneDocument_Fail_NotFound() throws Exception {
                mockMvc.perform(post("/api/marketplace/documents/9999/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value("Document not found"));
        }

        @Test
        void publishDocument_Fail_IfCloned() throws Exception {
                // 1. Tạo một tài liệu clone của clonerUser từ publicDoc
                Document clonedDoc = documentRepository.save(Document.builder()
                                .user(clonerUser)
                                .subject(subjectSWR)
                                .title("SRS Cloned Document")
                                .description("Cloned description")
                                .fileUrl("/uploads/srs.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .clonedFrom(publicDoc) // Đánh dấu là tài liệu clone
                                .build());

                // 2. Cố gắng đăng tải tài liệu clone này lên chợ
                MarketplaceSubmitRequest submitRequest = new MarketplaceSubmitRequest();
                submitRequest.setNote("Muon dang lai tai lieu clone");

                mockMvc.perform(post("/api/marketplace/documents/" + clonedDoc.getId() + "/submit")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(submitRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message")
                                                .value("Cannot publish a cloned document back to the marketplace."));
        }

        // ==========================================
        // INTEGRATION TESTS CHO CLONE QUIZ
        // ==========================================

        @Test
        void cloneQuiz_Success_WithNotebook() throws Exception {
                MarketplaceCloneRequest request = MarketplaceCloneRequest.builder()
                                .targetNotebookId(clonerNotebook.getId())
                                .build();

                mockMvc.perform(post("/api/marketplace/quizzes/" + publicQuiz.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Quiz cloned successfully from marketplace."))
                                .andExpect(jsonPath("$.data.title").value("Agile Scrum Quiz"))
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"))
                                .andExpect(jsonPath("$.data.clonedFromId").value(publicQuiz.getId()));

                // Kiểm tra database: Quiz được clone có liên kết với notebook đích không
                List<Quiz> clonerQuizzes = quizRepository.findAll().stream()
                                .filter(q -> q.getCreator().getId().equals(clonerUser.getId()))
                                .toList();
                assertEquals(1, clonerQuizzes.size());
                Quiz clonedQuiz = clonerQuizzes.get(0);
                assertNotNull(clonedQuiz.getNotebook());
                assertEquals(clonerNotebook.getId(), clonedQuiz.getNotebook().getId());
                assertNotNull(clonedQuiz.getClonedFrom());
                assertEquals(publicQuiz.getId(), clonedQuiz.getClonedFrom().getId());

                // Kiểm tra deep copy câu hỏi và đáp án
                List<QuizQuestion> clonedQuestions = quizQuestionRepository.findByQuizIdOrderById(clonedQuiz.getId());
                assertEquals(1, clonedQuestions.size());
                QuizQuestion clonedQ = clonedQuestions.get(0);
                assertEquals("What is Sprint?", clonedQ.getQuestionText());
                assertEquals(QuestionType.SINGLE_CHOICE, clonedQ.getQuestionType());

                // Kiểm tra options
                assertEquals(2, clonedQ.getOptions().size());
                assertTrue(clonedQ.getOptions().stream().anyMatch(
                                opt -> opt.getOptionText().equals("A timeboxed iteration") && opt.getIsCorrect()));

                // Kiểm tra downloadCount của quiz gốc phải tăng lên 1 (10 -> 11)
                Quiz updatedOriginal = quizRepository.findById(publicQuiz.getId()).orElseThrow();
                assertEquals(11, updatedOriginal.getDownloadCount());
        }

        @Test
        void publishQuiz_Fail_IfCloned() throws Exception {
                // 1. Tạo một đề thi clone của clonerUser từ publicQuiz
                Quiz clonedQuiz = quizRepository.save(Quiz.builder()
                                .creator(clonerUser)
                                .subject(subjectSWR)
                                .title("Agile Scrum Cloned Quiz")
                                .description("Cloned quiz description")
                                // Không cần examType vì validation clonedFrom đã được đưa lên đầu source code
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .clonedFrom(publicQuiz) // Đánh dấu là đề thi clone
                                .build());

                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(clonedQuiz)
                                .questionText("Cloned question?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                // 2. Cố gắng đăng tải đề thi clone này lên chợ
                MarketplaceSubmitRequest submitRequest = new MarketplaceSubmitRequest();
                submitRequest.setNote("Muon dang lai trac nghiem clone");

                mockMvc.perform(post("/api/marketplace/quizzes/" + clonedQuiz.getId() + "/submit")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(submitRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message")
                                                .value("Cannot publish a cloned quiz back to the marketplace."));
        }

        // ==========================================
        // INTEGRATION TESTS CHO CLONE FLASHCARDDECK
        // ==========================================

        @Test
        void cloneFlashcardDeck_Success_WithoutNotebook() throws Exception {
                mockMvc.perform(post("/api/marketplace/flashcard-decks/" + publicDeck.getId() + "/clone")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message")
                                                .value("Flashcard deck cloned successfully from marketplace."))
                                .andExpect(jsonPath("$.data.title").value("Design Pattern Cards"))
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"))
                                .andExpect(jsonPath("$.data.clonedFromId").value(publicDeck.getId()));

                // Kiểm tra database: Deck được clone và có 2 flashcards con
                List<FlashcardDeck> clonerDecks = flashcardDeckRepository.findAll().stream()
                                .filter(d -> d.getUser().getId().equals(clonerUser.getId()))
                                .toList();
                assertEquals(1, clonerDecks.size());
                FlashcardDeck clonedDeck = clonerDecks.get(0);
                assertEquals("Design Pattern Cards", clonedDeck.getTitle());
                assertEquals(2, clonedDeck.getCards().size());
                assertNotNull(clonedDeck.getClonedFrom());
                assertEquals(publicDeck.getId(), clonedDeck.getClonedFrom().getId());

                // Kiểm tra chi tiết cards
                assertTrue(clonedDeck.getCards().stream().anyMatch(c -> c.getFrontText().equals("Singleton Pattern")
                                && c.getBackText().equals("Only one instance of a class")));

                // Kiểm tra downloadCount của deck gốc phải tăng lên 1 (3 -> 4)
                FlashcardDeck updatedOriginal = flashcardDeckRepository.findById(publicDeck.getId()).orElseThrow();
                assertEquals(4, updatedOriginal.getDownloadCount());
        }

        @Test
        void publishFlashcardDeck_Fail_IfCloned() throws Exception {
                // 1. Tạo một bộ thẻ clone của clonerUser từ publicDeck
                FlashcardDeck clonedDeck = FlashcardDeck.builder()
                                .user(clonerUser)
                                .subject(subjectSWR)
                                .title("Design Pattern Cloned Cards")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .clonedFrom(publicDeck) // Đánh dấu là bộ thẻ clone
                                .cards(new ArrayList<>())
                                .build();

                clonedDeck.getCards().add(Flashcard.builder()
                                .deck(clonedDeck)
                                .frontText("Singleton")
                                .backText("One instance")
                                .build());

                flashcardDeckRepository.save(clonedDeck);

                // 2. Cố gắng đăng tải bộ thẻ clone này lên chợ
                MarketplaceSubmitRequest submitRequest = new MarketplaceSubmitRequest();
                submitRequest.setNote("Muon dang lai flashcard clone");

                mockMvc.perform(post("/api/marketplace/flashcard-decks/" + clonedDeck.getId() + "/submit")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(clonerUser)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(submitRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.message").value(
                                                "Cannot publish a cloned flashcard deck back to the marketplace."));
        }
}
