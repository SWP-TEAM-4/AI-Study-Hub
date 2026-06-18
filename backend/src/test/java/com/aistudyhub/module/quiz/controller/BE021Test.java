package com.aistudyhub.module.quiz.controller;

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
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration Test dành cho Task BE-021: API Sinh quiz mock từ notebook hoặc
 * tài liệu.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE021Test {

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
        private QuizRepository quizRepository;

        @Autowired
        private QuizQuestionRepository quizQuestionRepository;

        @Autowired
        private QuizOptionRepository quizOptionRepository;

        private User studentA;
        private User studentB;
        private Subject sampleSubject;
        private Notebook notebookA;
        private Notebook notebookB;
        private Document docA;
        private Document docB;
        private DocumentChunk chunk1;

        @BeforeEach
        void setUp() {
                notebookDocumentRepository.deleteAll();
                documentChunkRepository.deleteAll();
                documentRepository.deleteAll();
                notebookRepository.deleteAll();
                subjectRepository.deleteAll();
                quizOptionRepository.deleteAll();
                quizQuestionRepository.deleteAll();
                quizRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Tạo Users
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

                // 2. Tạo Subject
                sampleSubject = Subject.builder()
                                .code("PRN211")
                                .name("Basic C# Programming")
                                .build();
                sampleSubject = subjectRepository.save(sampleSubject);

                // 3. Tạo Notebooks
                notebookA = Notebook.builder()
                                .user(studentA)
                                .subject(sampleSubject)
                                .title("Sổ tay C# của Student A")
                                .build();
                notebookA = notebookRepository.save(notebookA);

                notebookB = Notebook.builder()
                                .user(studentB)
                                .subject(sampleSubject)
                                .title("Sổ tay C# của Student B")
                                .build();
                notebookB = notebookRepository.save(notebookB);

                // 4. Tạo Documents
                docA = Document.builder()
                                .user(studentA)
                                .subject(sampleSubject)
                                .title("Tài liệu C# nâng cao")
                                .visibility(Visibility.PRIVATE)
                                .build();
                docA = documentRepository.save(docA);

                docB = Document.builder()
                                .user(studentB)
                                .subject(sampleSubject)
                                .title("Tài liệu của Student B")
                                .visibility(Visibility.PRIVATE)
                                .build();
                docB = documentRepository.save(docB);

                // 5. Tạo Document Chunk cho docA
                chunk1 = DocumentChunk.builder()
                                .document(docA)
                                .chunkIndex(0)
                                .textContent("Lớp trừu tượng (abstract class) và interface là hai khái niệm OOP quan trọng trong C#.")
                                .build();
                chunk1 = documentChunkRepository.save(chunk1);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // =========================================================================
        // 1. KIỂM THỬ THÀNH CÔNG (SUCCESS SCENARIOS)
        // =========================================================================

        @Test
        void generateQuiz_Success_WithDocumentChunks() throws Exception {
                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfQuestions\": 3, \"questionType\": \"SINGLE_CHOICE\"}",
                                docA.getId());

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Quiz generated successfully"))
                                .andExpect(jsonPath("$.data.title").value("Tài liệu C# nâng cao - Mock Quiz"))
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"))
                                .andExpect(jsonPath("$.data.creatorId").value(studentA.getId()));
        }

        @Test
        void generateQuiz_Success_FallbackGeneric() throws Exception {
                // Tài liệu docA được xóa hết chunk
                documentChunkRepository.deleteAll();

                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfQuestions\": 2, \"questionType\": \"FILL_IN_THE_BLANK\"}",
                                docA.getId());

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Quiz generated successfully"));
        }

        @Test
        void generateQuiz_Success_WithNotebook() throws Exception {
                // Link docA vào notebookA
                NotebookDocument link = NotebookDocument.builder()
                                .notebook(notebookA)
                                .document(docA)
                                .build();
                notebookDocumentRepository.save(link);

                String requestJson = String.format(
                                "{\"notebookId\": %d, \"numberOfQuestions\": 2, \"questionType\": \"MULTIPLE_CHOICE\"}",
                                notebookA.getId());

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Quiz generated successfully"))
                                .andExpect(jsonPath("$.data.notebookId").value(notebookA.getId()));
        }

        // =========================================================================
        // 2. KIỂM THỬ LỖI PHÂN QUYỀN VÀ KHÔNG TÌM THẤY (ERROR SCENARIOS)
        // =========================================================================

        @Test
        void generateQuiz_ValidationError_MissingParams() throws Exception {
                // Thiếu cả documentId lẫn notebookId
                String requestJson = "{\"numberOfQuestions\": 5}";

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void generateQuiz_AccessDenied_Document() throws Exception {
                // Student A cố tình sinh quiz từ Document của Student B
                String requestJson = String.format(
                                "{\"documentId\": %d, \"numberOfQuestions\": 3}",
                                docB.getId());

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_ACCESS_DENIED"));
        }

        @Test
        void generateQuiz_NotFound_Document() throws Exception {
                // Sinh quiz với Document ID không tồn tại
                String requestJson = "{\"documentId\": 9999, \"numberOfQuestions\": 3}";

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
        }

        @Test
        void generateQuiz_AccessDenied_Notebook() throws Exception {
                // Student A cố tình sinh quiz từ Notebook của Student B
                String requestJson = String.format(
                                "{\"notebookId\": %d, \"numberOfQuestions\": 3}",
                                notebookB.getId());

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_ACCESS_DENIED"));
        }

        @Test
        void generateQuiz_NotFound_Notebook() throws Exception {
                // Sinh quiz với Notebook ID không tồn tại
                String requestJson = "{\"notebookId\": 9999, \"numberOfQuestions\": 3}";

                mockMvc.perform(post("/api/quizzes/generate")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_NOT_FOUND"));
        }
}
