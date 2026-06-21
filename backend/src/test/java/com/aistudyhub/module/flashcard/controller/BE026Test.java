package com.aistudyhub.module.flashcard.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration Test dành cho Task BE-026: API Tự động tạo Flashcard Mock.
 * Sử dụng H2 database ảo của profile "test".
 * Owner: BE3 (Task BE-026)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE026Test {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private NotebookRepository notebookRepository;

        @Autowired
        private DocumentRepository documentRepository;

        @Autowired
        private NotebookDocumentRepository notebookDocumentRepository;

        @Autowired
        private DocumentChunkRepository documentChunkRepository;

        @Autowired
        private FlashcardDeckRepository deckRepository;

        private User studentA;
        private User studentB;
        private Subject subjectA;
        private Notebook notebookA;
        private Notebook notebookB;
        private Document docA;
        private Document docB;
        private DocumentChunk chunkA1;
        private DocumentChunk chunkA2;

        @BeforeEach
        void setUp() {
                // Xóa sạch dữ liệu trong DB ảo theo đúng thứ tự ràng buộc khóa ngoại
                deckRepository.deleteAll();
                documentChunkRepository.deleteAll();
                notebookDocumentRepository.deleteAll();
                documentRepository.deleteAll();
                notebookRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed Users
                studentA = User.builder()
                                .email("studenta@aistudyhub.com")
                                .fullName("Student A")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build();
                studentA = userRepository.save(studentA);

                studentB = User.builder()
                                .email("studentb@aistudyhub.com")
                                .fullName("Student B")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build();
                studentB = userRepository.save(studentB);

                // 2. Seed Subject
                subjectA = Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build();
                subjectA = subjectRepository.save(subjectA);

                // 3. Seed Notebooks
                notebookA = Notebook.builder()
                                .user(studentA)
                                .subject(subjectA)
                                .title("Notebook SWR302 A")
                                .build();
                notebookA = notebookRepository.save(notebookA);

                notebookB = Notebook.builder()
                                .user(studentB)
                                .subject(subjectA)
                                .title("Notebook SWR302 B")
                                .build();
                notebookB = notebookRepository.save(notebookB);

                // 4. Seed Documents
                docA = Document.builder()
                                .user(studentA)
                                .subject(subjectA)
                                .title("SWR302 Chapter 1 Requirements")
                                .description("SRS concepts")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .build();
                docA = documentRepository.save(docA);

                docB = Document.builder()
                                .user(studentB)
                                .subject(subjectA)
                                .title("SWR302 Chapter 2 Use Cases")
                                .description("Use Case diagrams")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .build();
                docB = documentRepository.save(docB);

                // 5. Seed Document Chunks for docA
                chunkA1 = DocumentChunk.builder()
                                .document(docA)
                                .chunkIndex(0)
                                .textContent("An SRS (Software Requirements Specification) is a document that describes what the software will do.")
                                .sourcePage(1)
                                .build();
                chunkA1 = documentChunkRepository.save(chunkA1);

                chunkA2 = DocumentChunk.builder()
                                .document(docA)
                                .chunkIndex(1)
                                .textContent("Functional requirements define a function of a system or its component.")
                                .sourcePage(2)
                                .build();
                chunkA2 = documentChunkRepository.save(chunkA2);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // =========================================================================
        // KIỂM THỬ CÁC KỊCH BẢN THÀNH CÔNG (SUCCESS CASES)
        // =========================================================================

        @Test
        void generateDeck_Success_WithDocumentChunks() throws Exception {
                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfCards\": 3}",
                                docA.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Success"))
                                .andExpect(jsonPath("$.data.title").value("SWR302 Chapter 1 Requirements Flashcards"))
                                .andExpect(jsonPath("$.data.userId").value(studentA.getId()))
                                .andExpect(jsonPath("$.data.notebookId").isEmpty())
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"))
                                // Số lượng cards sinh ra phải khớp với numberOfCards
                                .andExpect(jsonPath("$.data.cards.length()").value(3))
                                // Verify logic xoay vòng (round-robin) trên 2 chunks có sẵn
                                .andExpect(jsonPath("$.data.cards[0].frontText").value(
                                                "Khái niệm từ tài liệu 'SWR302 Chapter 1 Requirements' (Trang 1)"))
                                .andExpect(jsonPath("$.data.cards[0].backText").value(
                                                "An SRS (Software Requirements Specification) is a document that describes what the software will do."))
                                .andExpect(jsonPath("$.data.cards[1].frontText").value(
                                                "Khái niệm từ tài liệu 'SWR302 Chapter 1 Requirements' (Trang 2)"))
                                .andExpect(jsonPath("$.data.cards[1].backText").value(
                                                "Functional requirements define a function of a system or its component."))
                                // Card số 3 xoay vòng lại chunk 1
                                .andExpect(jsonPath("$.data.cards[2].frontText").value(
                                                "Khái niệm từ tài liệu 'SWR302 Chapter 1 Requirements' (Trang 1)"));
        }

        @Test
        void generateDeck_Success_WithNotebookLinkedDocs() throws Exception {
                // Liên kết notebookA với docA
                NotebookDocument notebookDoc = NotebookDocument.builder()
                                .notebook(notebookA)
                                .document(docA)
                                .build();
                notebookDocumentRepository.save(notebookDoc);

                String requestJson = String.format(
                                "{\"notebookId\": %d, \"numberOfCards\": 2}",
                                notebookA.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.title").value("Notebook SWR302 A Flashcards"))
                                .andExpect(jsonPath("$.data.notebookId").value(notebookA.getId()))
                                .andExpect(jsonPath("$.data.cards.length()").value(2))
                                .andExpect(jsonPath("$.data.cards[0].frontText").value(
                                                "Khái niệm từ tài liệu 'SWR302 Chapter 1 Requirements' (Trang 1)"));
        }

        @Test
        void generateDeck_Success_FallbackToSamples_WhenNoChunks() throws Exception {
                // Tạo một tài liệu trống không có chunks
                Document emptyDoc = Document.builder()
                                .user(studentA)
                                .subject(subjectA)
                                .title("Empty Book")
                                .build();
                emptyDoc = documentRepository.save(emptyDoc);

                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfCards\": 2}",
                                emptyDoc.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.cards.length()").value(2))
                                .andExpect(jsonPath("$.data.cards[0].frontText").value("Khái niệm mẫu số 1"))
                                .andExpect(jsonPath("$.data.cards[0].backText")
                                                .value("Định nghĩa giả lập cho khái niệm số 1 trích từ 'Empty Book'"));
        }

        // =========================================================================
        // KIỂM THỬ CÁC KỊCH BẢN THẤT BẠI (ERROR CASES)
        // =========================================================================

        @Test
        void generateDeck_BadRequest_NeitherNotebookNorDocumentProvided() throws Exception {
                String requestJson = "{\"numberOfCards\": 10}";

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void generateDeck_Forbidden_DocumentOwnedByOtherUser() throws Exception {
                // Student A cố gắng sinh thẻ từ docB của Student B
                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfCards\": 5}",
                                docB.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_ACCESS_DENIED"));
        }

        @Test
        void generateDeck_Forbidden_NotebookOwnedByOtherUser() throws Exception {
                // Student A cố gắng sinh thẻ từ notebookB của Student B
                String requestJson = String.format(
                                "{\"notebookId\": %d, \"numberOfCards\": 5}",
                                notebookB.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_ACCESS_DENIED"));
        }

        @Test
        void generateDeck_NotFound_DocumentNotExist() throws Exception {
                String requestJson = "{\"documentId\": 99999, \"numberOfCards\": 5}";

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
        }

        @Test
        void generateDeck_NotFound_NotebookNotExist() throws Exception {
                String requestJson = "{\"notebookId\": 99999, \"numberOfCards\": 5}";

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_NOT_FOUND"));
        }

        @Test
        void generateDeck_BadRequest_ValidationError_ZeroCards() throws Exception {
                // Thử tạo 0 thẻ (Validation tối thiểu là 1)
                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfCards\": 0}",
                                docA.getId());

                mockMvc.perform(post("/api/flashcard-decks/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }
}
