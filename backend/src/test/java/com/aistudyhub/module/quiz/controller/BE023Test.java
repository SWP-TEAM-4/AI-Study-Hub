package com.aistudyhub.module.quiz.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.TestStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserQuizProgress;
import com.aistudyhub.repository.QuizOptionRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.TestRepository;
import com.aistudyhub.repository.UserQuizProgressRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration Test dành cho Task BE-023: API Nộp bài thi, xem kết quả và xem lịch sử thi.
 * Sử dụng MockMvc + H2 database ảo của profile "test".
 * Không sử dụng Mockito @MockBean để tránh lỗi tương thích bytecode Java 26.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE023Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private QuizOptionRepository quizOptionRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private UserQuizProgressRepository userQuizProgressRepository;

    private User studentA;
    private User studentB;
    private Quiz sampleQuiz;
    private QuizQuestion question1;
    private QuizOption correctOption1;
    private QuizOption incorrectOption1;

    @BeforeEach
    void setUp() {
        // Clear database trước mỗi test case để đảm bảo tính độc lập
        userQuizProgressRepository.deleteAll();
        testRepository.deleteAll();
        quizOptionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Khởi tạo dữ liệu User học sinh
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

        // 2. Khởi tạo dữ liệu Quiz
        sampleQuiz = Quiz.builder()
                .creator(studentA)
                .title("Java Core Quiz")
                .visibility(Visibility.PUBLIC_LINK)
                .build();
        sampleQuiz = quizRepository.save(sampleQuiz);

        // 3. Khởi tạo câu hỏi trắc nghiệm
        question1 = QuizQuestion.builder()
                .quiz(sampleQuiz)
                .questionText("JDK stands for Java Development Kit?")
                .questionType(QuestionType.SINGLE_CHOICE)
                .explanation("JDK stands for Java Development Kit, which is used to develop Java apps.")
                .build();
        question1 = quizQuestionRepository.save(question1);

        correctOption1 = QuizOption.builder()
                .question(question1)
                .optionText("True")
                .isCorrect(true)
                .build();
        correctOption1 = quizOptionRepository.save(correctOption1);

        incorrectOption1 = QuizOption.builder()
                .question(question1)
                .optionText("False")
                .isCorrect(false)
                .build();
        incorrectOption1 = quizOptionRepository.save(incorrectOption1);

        question1.setOptions(new ArrayList<>(Arrays.asList(correctOption1, incorrectOption1)));
        question1 = quizQuestionRepository.save(question1);
    }

    // Đóng gói User vào CustomUserDetails của Spring Security
    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }

    // =========================================================================
    // 1. KIỂM THỬ: API POST /api/tests/{testId}/submit (Nộp bài thi)
    // =========================================================================

    @Test
    void submitTest_Success_CorrectCalculation() throws Exception {
        // Lượt thi mới bắt đầu ở trạng thái IN_PROGRESS
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("My Java Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        // Giả lập học sinh trả lời Đúng cho câu hỏi 1
        UserQuizProgress progress = UserQuizProgress.builder()
                .test(test)
                .question(question1)
                .selectedOption(correctOption1)
                .isCorrect(true)
                .build();
        userQuizProgressRepository.save(progress);

        String requestBody = "{\"confirmSubmit\": true}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails(studentA)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Test submitted successfully"))
                .andExpect(jsonPath("$.data.testId").value(test.getId()))
                .andExpect(jsonPath("$.data.totalScore").value(10.0)) // Đúng 1/1 câu -> 10 điểm
                .andExpect(jsonPath("$.data.correctAnswers").value(1))
                .andExpect(jsonPath("$.data.totalQuestions").value(1))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.items[0].isCorrect").value(true))
                .andExpect(jsonPath("$.data.items[0].explanation").value(question1.getExplanation()));
    }

    @Test
    void submitTest_Success_ReturnCachedResultIfAlreadyCompleted() throws Exception {
        // Lượt thi đã COMPLETED sẵn từ trước
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Finished Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .totalScore(BigDecimal.valueOf(10.0))
                .status(TestStatus.COMPLETED)
                .build();
        test = testRepository.save(test);

        UserQuizProgress progress = UserQuizProgress.builder()
                .test(test)
                .question(question1)
                .selectedOption(correctOption1)
                .isCorrect(true)
                .build();
        userQuizProgressRepository.save(progress);

        String requestBody = "{\"confirmSubmit\": true}";

        // Nộp lại lần 2, hệ thống phải trả kết quả cũ đã tính từ trước mà không ném lỗi
        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails(studentA)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    void submitTest_Failure_TestNotFound() throws Exception {
        String requestBody = "{\"confirmSubmit\": true}";

        // ID lượt thi 99999 không tồn tại -> Trả lỗi 404
        mockMvc.perform(post("/api/tests/99999/submit")
                .with(user(userDetails(studentA)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Test not found"));
    }

    @Test
    void submitTest_Failure_AccessDenied() throws Exception {
        // Lượt thi của StudentA
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("A's Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        String requestBody = "{\"confirmSubmit\": true}";

        // StudentB cố nộp bài của StudentA -> Chặn ném lỗi 403 Forbidden
        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails(studentB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this test"));
    }

    @Test
    void submitTest_Failure_ValidationError_ConfirmFalse() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("A's Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        // Client truyền confirmSubmit = false -> Validator chặn lỗi 400 Bad Request
        String requestBody = "{\"confirmSubmit\": false}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails(studentA)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    // =========================================================================
    // 2. KIỂM THỬ: API GET /api/tests/{testId}/result (Xem kết quả bài thi)
    // =========================================================================

    @Test
    void getTestResult_Success() throws Exception {
        // Lượt thi đã nộp bài (COMPLETED)
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Result Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .totalScore(BigDecimal.valueOf(10.0))
                .status(TestStatus.COMPLETED)
                .build();
        test = testRepository.save(test);

        UserQuizProgress progress = UserQuizProgress.builder()
                .test(test)
                .question(question1)
                .selectedOption(correctOption1)
                .isCorrect(true)
                .build();
        userQuizProgressRepository.save(progress);

        mockMvc.perform(get("/api/tests/" + test.getId() + "/result")
                .with(user(userDetails(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalScore").value(10.0))
                .andExpect(jsonPath("$.data.items[0].explanation").value(question1.getExplanation()));
    }

    @Test
    void getTestResult_Failure_StillInProgress() throws Exception {
        // Lượt thi vẫn đang làm dở (IN_PROGRESS)
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Running Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        // Cố tình xem điểm khi chưa nộp bài -> Chặn ném lỗi 400 Bad Request
        mockMvc.perform(get("/api/tests/" + test.getId() + "/result")
                .with(user(userDetails(studentA))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Test is still in progress"));
    }

    // =========================================================================
    // 3. KIỂM THỬ: API GET /api/users/me/tests (Xem lịch sử lượt thi)
    // =========================================================================

    @Test
    void getUserTestHistory_Success_PaginationAndSearch() throws Exception {
        // Tạo 2 lượt thi cho StudentA
        com.aistudyhub.entity.Test test1 = com.aistudyhub.entity.Test.builder()
                .title("Midterm Java Core")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.COMPLETED)
                .build();
        testRepository.save(test1);

        com.aistudyhub.entity.Test test2 = com.aistudyhub.entity.Test.builder()
                .title("Final Database Exam")
                .quiz(sampleQuiz)
                .user(studentA)
                .status(TestStatus.IN_PROGRESS)
                .build();
        testRepository.save(test2);

        // 1. Kiểm tra lấy toàn bộ lịch sử thi phân trang (được 2 bản ghi)
        mockMvc.perform(get("/api/users/me/tests?page=0&size=10")
                .with(user(userDetails(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2));

        // 2. Kiểm tra tìm kiếm lịch sử theo keyword = "Database" (chỉ được 1 bản ghi khớp)
        mockMvc.perform(get("/api/users/me/tests?keyword=Database")
                .with(user(userDetails(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].title").value("Final Database Exam"));
    }
}
