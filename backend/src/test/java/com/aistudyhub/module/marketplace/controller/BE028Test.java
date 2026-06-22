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
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Lớp kiểm thử tích hợp (Integration Test) cho các API duyệt và tìm kiếm tài
 * nguyên trên Chợ.
 * Sử dụng H2 database ảo với profile "test" và MockMvc để giả lập cuộc gọi
 * HTTP.
 * 
 * Owner: BE3 (Task BE-028)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE028Test {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private SemesterRepository semesterRepository;

        @Autowired
        private DocumentRepository documentRepository;

        @Autowired
        private QuizRepository quizRepository;

        @Autowired
        private QuizQuestionRepository quizQuestionRepository;

        @Autowired
        private FlashcardDeckRepository flashcardDeckRepository;

        private User studentUser;
        private Subject subjectSWR;
        private Subject subjectSWP;
        private Semester semesterSpring;

        @BeforeEach
        void setUp() {
                // Xóa sạch cơ sở dữ liệu theo đúng thứ tự ràng buộc khóa ngoại
                quizQuestionRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                quizRepository.deleteAll();
                documentRepository.deleteAll();
                subjectRepository.deleteAll();
                semesterRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed dữ liệu người dùng
                studentUser = userRepository.save(User.builder()
                                .email("student.test@fpt.edu.vn")
                                .fullName("Nguyen Van Hoc")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // 2. Seed dữ liệu môn học
                subjectSWR = subjectRepository.save(Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build());

                subjectSWP = subjectRepository.save(Subject.builder()
                                .code("SWP302")
                                .name("Software Development Project")
                                .build());

                // 3. Seed dữ liệu học kỳ (Semester)
                semesterSpring = semesterRepository.save(Semester.builder()
                                .code("SP26")
                                .name("Spring 2026")
                                .build());

                // 4. Seed dữ liệu Documents (Tài liệu)
                // Doc 1: SWR302, Approved, downloadCount = 15, acceptPercentage = 92.5
                documentRepository.save(Document.builder()
                                .user(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Requirement Specification Guide")
                                .description("Huong dan viet dac ta yeu cau SRS rat chi tiet")
                                .fileUrl("/uploads/swr_req.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(15)
                                .acceptPercentage(new BigDecimal("92.50"))
                                .build());

                // Doc 2: SWR302, Approved, downloadCount = 5, acceptPercentage = 85.0
                documentRepository.save(Document.builder()
                                .user(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Design Patterns Guide")
                                .description("Huong dan ap dung mau thiet ke trong phan tich")
                                .fileUrl("/uploads/swr_design.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(5)
                                .acceptPercentage(new BigDecimal("85.00"))
                                .build());

                // Doc 3: SWP302, Approved, downloadCount = 30, acceptPercentage = 99.0
                documentRepository.save(Document.builder()
                                .user(studentUser)
                                .subject(subjectSWP)
                                .title("SWP302 Project Architecture Spec")
                                .description("Dac ta kien truc he thong microservices cho do an")
                                .fileUrl("/uploads/swp_arch.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(30)
                                .acceptPercentage(new BigDecimal("99.00"))
                                .build());

                // Doc 4 (Ẩn/Chưa duyệt): Visibility là PRIVATE, marketStatus là NONE -> Không
                // được hiển thị
                documentRepository.save(Document.builder()
                                .user(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Draft document")
                                .description("Ban nhap tai lieu")
                                .fileUrl("/uploads/swr_draft.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build());

                // Doc 5 (Chờ duyệt): Visibility là MARKETPLACE, nhưng marketStatus là PENDING
                // -> Không được hiển thị
                documentRepository.save(Document.builder()
                                .user(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Pending Doc")
                                .description("Tai lieu dang cho duyet")
                                .fileUrl("/uploads/swr_pending.pdf")
                                .processingStatus(ProcessingStatus.SUCCESS)
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.PENDING)
                                .build());

                // 5. Seed dữ liệu Quizzes (Đề thi)
                // Quiz 1: SWR302, Approved, term = semesterSpring, examType = "Final",
                // downloadCount = 10, acceptPercentage = 88.0
                Quiz quiz1 = quizRepository.save(Quiz.builder()
                                .creator(studentUser)
                                .subject(subjectSWR)
                                .academicTerm(semesterSpring)
                                .examType("Final")
                                .title("SWR302 Final Exam Prep Quiz")
                                .description("Bo cau hoi trac nghiem on thi cuoi ky SRS")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(10)
                                .acceptPercentage(new BigDecimal("88.00"))
                                .build());
                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(quiz1)
                                .questionText("What does SRS stand for?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                // Quiz 2: SWR302, Approved, term = semesterSpring, examType = "Midterm",
                // downloadCount = 2, acceptPercentage = 75.0
                Quiz quiz2 = quizRepository.save(Quiz.builder()
                                .creator(studentUser)
                                .subject(subjectSWR)
                                .academicTerm(semesterSpring)
                                .examType("Midterm")
                                .title("SWR302 Midterm Exam Quiz")
                                .description("On tap giua ky")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(2)
                                .acceptPercentage(new BigDecimal("75.00"))
                                .build());
                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(quiz2)
                                .questionText("What is a functional requirement?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                // Quiz 3 (Ẩn/Từ chối duyệt): Không được hiển thị
                Quiz quiz3 = quizRepository.save(Quiz.builder()
                                .creator(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Rejected Quiz")
                                .description("De thi bi tu choi")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.REJECTED)
                                .build());
                quizQuestionRepository.save(QuizQuestion.builder()
                                .quiz(quiz3)
                                .questionText("Rejected question?")
                                .questionType(QuestionType.SINGLE_CHOICE)
                                .build());

                // 6. Seed dữ liệu FlashcardDecks (Thẻ ghi nhớ)
                // Deck 1: SWR302, Approved, downloadCount = 8, acceptPercentage = 90.0
                FlashcardDeck deck1 = FlashcardDeck.builder()
                                .user(studentUser)
                                .subject(subjectSWR)
                                .title("SWR302 Agile Vocabulary Cards")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(8)
                                .acceptPercentage(new BigDecimal("90.00"))
                                .cards(new ArrayList<>())
                                .build();
                deck1.getCards().add(Flashcard.builder().deck(deck1).frontText("Sprint")
                                .backText("A set period of time").build());
                flashcardDeckRepository.save(deck1);

                // Deck 2: SWP302, Approved, downloadCount = 1, acceptPercentage = 60.0
                FlashcardDeck deck2 = FlashcardDeck.builder()
                                .user(studentUser)
                                .subject(subjectSWP)
                                .title("SWP302 Git Command Cards")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(1)
                                .acceptPercentage(new BigDecimal("60.00"))
                                .cards(new ArrayList<>())
                                .build();
                deck2.getCards().add(Flashcard.builder().deck(deck2).frontText("git rebase").backText("Reapply commits")
                                .build());
                flashcardDeckRepository.save(deck2);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // ==========================================
        // INTEGRATION TESTS CHO API GET DOCUMENTS
        // ==========================================

        @Test
        void getDocuments_Success_ShouldReturnOnlyApprovedMarketplaceDocs() throws Exception {
                mockMvc.perform(get("/api/marketplace/documents")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items", hasSize(3))) // 3 tài liệu Approved
                                .andExpect(jsonPath("$.data.items[0].targetType").value("DOCUMENT"))
                                .andExpect(jsonPath("$.data.totalElements").value(3))
                                .andExpect(jsonPath("$.data.totalPages").value(1));
        }

        @Test
        void getDocuments_FilterBySubject_ShouldReturnDocsOfCorrectSubject() throws Exception {
                mockMvc.perform(get("/api/marketplace/documents")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("subjectId", subjectSWP.getId().toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(1))) // Chỉ có 1 tài liệu của môn SWP
                                .andExpect(jsonPath("$.data.items[0].title").value("SWP302 Project Architecture Spec"));
        }

        @Test
        void getDocuments_SearchByKeyword_ShouldReturnMatchingDocs() throws Exception {
                mockMvc.perform(get("/api/marketplace/documents")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("keyword", "Design"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(1)))
                                .andExpect(jsonPath("$.data.items[0].title").value("SWR302 Design Patterns Guide"));
        }

        @Test
        void getDocuments_SortByDownloadCount_ShouldReturnDocsInDescOrder() throws Exception {
                mockMvc.perform(get("/api/marketplace/documents")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("sort", "downloadCount"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items[0].downloadCount").value(30)) // Doc 3
                                .andExpect(jsonPath("$.data.items[1].downloadCount").value(15)) // Doc 1
                                .andExpect(jsonPath("$.data.items[2].downloadCount").value(5)); // Doc 2
        }

        // ==========================================
        // INTEGRATION TESTS CHO API GET QUIZZES
        // ==========================================

        @Test
        void getQuizzes_Success_WithAcademicTermAndExamTypeFilters() throws Exception {
                // Lọc theo semesterSpring và examType = "Final"
                mockMvc.perform(get("/api/marketplace/quizzes")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("academicTermId", semesterSpring.getId().toString())
                                .param("examType", "Final"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(1)))
                                .andExpect(jsonPath("$.data.items[0].title").value("SWR302 Final Exam Prep Quiz"));
        }

        @Test
        void getQuizzes_SearchKeyword_ShouldReturnMatchingQuiz() throws Exception {
                mockMvc.perform(get("/api/marketplace/quizzes")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("keyword", "Midterm"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(1)))
                                .andExpect(jsonPath("$.data.items[0].title").value("SWR302 Midterm Exam Quiz"));
        }

        // ==========================================
        // INTEGRATION TESTS CHO API GET FLASHCARDS
        // ==========================================

        @Test
        void getFlashcardDecks_Success_WithKeywordSearch() throws Exception {
                mockMvc.perform(get("/api/marketplace/flashcard-decks")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("keyword", "Git"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(1)))
                                .andExpect(jsonPath("$.data.items[0].title").value("SWP302 Git Command Cards"));
        }

        // ==========================================
        // INTEGRATION TESTS CHO API SEARCH MARKETPLACE
        // ==========================================

        @Test
        void searchMarketplace_Success_ShouldCombineAndSortByDownloadCount() throws Exception {
                // Gọi tìm kiếm tổng hợp không truyền môn học hay từ khóa -> Lấy ra toàn bộ 7
                // thực thể Approved
                mockMvc.perform(get("/api/marketplace/search")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("sort", "downloadCount"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items", hasSize(7)))
                                // Xếp thứ tự lượt tải: 30 (Doc 3) -> 15 (Doc 1) -> 10 (Quiz 1) -> 8 (Deck 1) ->
                                // 5 (Doc 2) -> 2 (Quiz 2) -> 1 (Deck 2)
                                .andExpect(jsonPath("$.data.items[0].downloadCount").value(30))
                                .andExpect(jsonPath("$.data.items[0].targetType").value("DOCUMENT"))
                                .andExpect(jsonPath("$.data.items[1].downloadCount").value(15))
                                .andExpect(jsonPath("$.data.items[2].downloadCount").value(10))
                                .andExpect(jsonPath("$.data.items[2].targetType").value("QUIZ"))
                                .andExpect(jsonPath("$.data.items[3].downloadCount").value(8))
                                .andExpect(jsonPath("$.data.items[3].targetType").value("FLASHCARD_DECK"));
        }

        @Test
        void searchMarketplace_WithSubjectFilter_ShouldReturnOnlySubjectItems() throws Exception {
                // Lọc tổng hợp theo môn học SWR302
                mockMvc.perform(get("/api/marketplace/search")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("subjectId", subjectSWR.getId().toString())
                                .param("sort", "acceptPercentage"))
                                .andExpect(status().isOk())
                                // SWR302 có: Doc 1 (92.50), Doc 2 (85.00), Quiz 1 (88.00), Quiz 2 (75.00), Deck
                                // 1 (90.00) -> Tổng 5 tài nguyên
                                .andExpect(jsonPath("$.data.items", hasSize(5)))
                                // Sắp xếp theo acceptPercentage: Doc 1 (92.5) -> Deck 1 (90.0) -> Quiz 1 (88.0)
                                // -> Doc 2 (85.0) -> Quiz 2 (75.0)
                                .andExpect(jsonPath("$.data.items[0].acceptPercentage").value(92.5))
                                .andExpect(jsonPath("$.data.items[1].acceptPercentage").value(90.0))
                                .andExpect(jsonPath("$.data.items[2].acceptPercentage").value(88.0))
                                .andExpect(jsonPath("$.data.items[3].acceptPercentage").value(85.0))
                                .andExpect(jsonPath("$.data.items[4].acceptPercentage").value(75.0));
        }

        @Test
        void searchMarketplace_WithPagination_ShouldSliceCorrectly() throws Exception {
                mockMvc.perform(get("/api/marketplace/search")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("page", "1") // Trang số 1 (trang thứ hai)
                                .param("size", "3") // Mỗi trang 3 phần tử
                                .param("sort", "downloadCount"))
                                .andExpect(status().isOk())
                                // Tổng cộng có 7 phần tử -> trang 0 có 3, trang 1 có 3, trang 2 có 1
                                .andExpect(jsonPath("$.data.items", hasSize(3)))
                                .andExpect(jsonPath("$.data.totalElements").value(7))
                                .andExpect(jsonPath("$.data.totalPages").value(3))
                                // Trang 1 chứa phần tử thứ 4, 5, 6 tương ứng downloadCount: 8 (Deck 1), 5 (Doc
                                // 2), 2 (Quiz 2)
                                .andExpect(jsonPath("$.data.items[0].downloadCount").value(8))
                                .andExpect(jsonPath("$.data.items[1].downloadCount").value(5))
                                .andExpect(jsonPath("$.data.items[2].downloadCount").value(2));
        }

        // ==========================================
        // DEFENSIVE VALIDATION TEST (PHÒNG NGỰ LỖI)
        // ==========================================

        @Test
        void getDocuments_WithNegativePageAndZeroSize_ShouldDefaultSafely() throws Exception {
                // Truyền page = -1 và size = 0. Service phải tự chuẩn hóa về page = 0, size =
                // 10
                mockMvc.perform(get("/api/marketplace/documents")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("page", "-1")
                                .param("size", "0"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.page").value(0))
                                .andExpect(jsonPath("$.data.size").value(10))
                                .andExpect(jsonPath("$.data.items", hasSize(3))); // Vẫn trả đủ 3 tài liệu
        }

        @Test
        void searchMarketplace_Success_DefaultSortByNewest() throws Exception {
                // Test default sorting (by newest) in searchMarketplace to cover the else
                // branch
                mockMvc.perform(get("/api/marketplace/search")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items", hasSize(7)));
        }

        @Test
        void searchMarketplace_Success_ExplicitSortByNewest() throws Exception {
                // Test explicit newest sorting in searchMarketplace
                mockMvc.perform(get("/api/marketplace/search")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(studentUser)))
                                .param("sort", "newest"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items", hasSize(7)));
        }
}
