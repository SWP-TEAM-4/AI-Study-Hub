package com.aistudyhub.module.quiz.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.aistudyhub.repository.QuizOptionRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.TestRepository;
import com.aistudyhub.repository.UserQuizProgressRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE022Test {

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

    private User creator;
    private User student;
    private Quiz publicQuiz;
    private Quiz privateQuiz;
    private QuizQuestion choiceQuestion;
    private QuizOption correctOption;
    private QuizOption incorrectOption;
    private QuizQuestion fibQuestion;
    private QuizOption fibCorrectOption;

    @BeforeEach
    void setUp() {
        // Clear database tables to ensure test independence
        userQuizProgressRepository.deleteAll();
        testRepository.deleteAll();
        quizOptionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        creator = User.builder()
                .email("creator@aistudyhub.com")
                .fullName("Quiz Creator")
                .role(Role.STUDENT)
                .isActive(true)
                .build();
        creator = userRepository.save(creator);

        student = User.builder()
                .email("student@aistudyhub.com")
                .fullName("Test Student")
                .role(Role.STUDENT)
                .isActive(true)
                .build();
        student = userRepository.save(student);

        // 2. Create Public Quiz
        publicQuiz = Quiz.builder()
                .creator(creator)
                .title("Public Java Quiz")
                .visibility(Visibility.PUBLIC_LINK)
                .build();
        publicQuiz = quizRepository.save(publicQuiz);

        // 3. Create Private Quiz
        privateQuiz = Quiz.builder()
                .creator(creator)
                .title("Private Db Quiz")
                .visibility(Visibility.PRIVATE)
                .build();
        privateQuiz = quizRepository.save(privateQuiz);

        // 4. Create Single Choice Question for Public Quiz
        choiceQuestion = QuizQuestion.builder()
                .quiz(publicQuiz)
                .questionText("Spring Boot is a...?")
                .questionType(QuestionType.SINGLE_CHOICE)
                .build();
        choiceQuestion = quizQuestionRepository.save(choiceQuestion);

        correctOption = QuizOption.builder()
                .question(choiceQuestion)
                .optionText("Java Framework")
                .isCorrect(true)
                .build();
        correctOption = quizOptionRepository.save(correctOption);

        incorrectOption = QuizOption.builder()
                .question(choiceQuestion)
                .optionText("Database")
                .isCorrect(false)
                .build();
        incorrectOption = quizOptionRepository.save(incorrectOption);

        choiceQuestion.setOptions(new ArrayList<>(Arrays.asList(correctOption, incorrectOption)));
        choiceQuestion = quizQuestionRepository.save(choiceQuestion);

        // 5. Create Fill-in-the-blank Question for Public Quiz
        fibQuestion = QuizQuestion.builder()
                .quiz(publicQuiz)
                .questionText("SQL stands for Structured ______ Language")
                .questionType(QuestionType.FILL_IN_THE_BLANK)
                .build();
        fibQuestion = quizQuestionRepository.save(fibQuestion);

        fibCorrectOption = QuizOption.builder()
                .question(fibQuestion)
                .optionText("Query")
                .isCorrect(true)
                .build();
        fibCorrectOption = quizOptionRepository.save(fibCorrectOption);

        fibQuestion.setOptions(new ArrayList<>(Arrays.asList(fibCorrectOption)));
        fibQuestion = quizQuestionRepository.save(fibQuestion);
    }

    // Helper to wrap User in CustomUserDetails
    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }

    // =========================================================================
    // 1. API: POST /api/quizzes/{quizId}/tests (Bắt đầu làm bài test - Tạo lượt thi)
    // =========================================================================

    @Test
    void startTest_Success_AllQuestions() throws Exception {
        String requestBody = "{\n" +
                "  \"title\": \"My Attempt\",\n" +
                "  \"duration\": 45,\n" +
                "  \"quizSelectionMode\": \"ALL\"\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/" + publicQuiz.getId() + "/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("My Attempt"))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.questions.length()").value(2))
                .andExpect(jsonPath("$.data.questions[0].options.length()").value(2))
                // Kiểm tra chống gian lận: không được để lộ isCorrect hay explanation
                .andExpect(jsonPath("$.data.questions[0].options[0].isCorrect").doesNotExist())
                .andExpect(jsonPath("$.data.questions[0].explanation").doesNotExist());
    }

    @Test
    void startTest_AccessDenied_PrivateQuiz() throws Exception {
        String requestBody = "{\n" +
                "  \"quizSelectionMode\": \"ALL\"\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/" + privateQuiz.getId() + "/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this quiz"));
    }

    @Test
    void startTest_QuizNotFound() throws Exception {
        String requestBody = "{\n" +
                "  \"quizSelectionMode\": \"ALL\"\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/99999/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Quiz not found"));
    }

    @Test
    void startTest_EmptyQuestionSelection() throws Exception {
        String requestBody = "{\n" +
                "  \"quizSelectionMode\": \"SELECTED\",\n" +
                "  \"questionIds\": []\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/" + publicQuiz.getId() + "/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("selectionMode=SELECTED requires at least one questionId"));
    }

    @Test
    void startTest_QuestionNotInQuiz() throws Exception {
        // Tạo câu hỏi thuộc privateQuiz
        QuizQuestion otherQuestion = QuizQuestion.builder()
                .quiz(privateQuiz)
                .questionText("Private Question?")
                .questionType(QuestionType.SINGLE_CHOICE)
                .build();
        otherQuestion = quizQuestionRepository.save(otherQuestion);

        String requestBody = "{\n" +
                "  \"quizSelectionMode\": \"SELECTED\",\n" +
                "  \"questionIds\": [" + otherQuestion.getId() + "]\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/" + publicQuiz.getId() + "/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Some questionIds do not belong to this quiz"));
    }

    @Test
    void startTest_NotEnoughQuestions() throws Exception {
        String requestBody = "{\n" +
                "  \"quizSelectionMode\": \"RANDOM\",\n" +
                "  \"randomCount\": 99\n" +
                "}";

        mockMvc.perform(post("/api/quizzes/" + publicQuiz.getId() + "/tests")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("randomCount exceeds available questions in quiz"));
    }

    // =========================================================================
    // 2. API: POST /api/tests/{testId}/answers (Lưu câu trả lời - Auto-save)
    // =========================================================================

    @Test
    void submitAnswer_Success_ChoiceQuestion() throws Exception {
        // Khởi tạo bài test trước
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Live Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        com.aistudyhub.entity.UserQuizProgress progress = com.aistudyhub.entity.UserQuizProgress.builder()
                .test(test)
                .question(choiceQuestion)
                .build();
        userQuizProgressRepository.save(progress);

        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": " + correctOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.selectedOptionId").value(correctOption.getId()))
                .andExpect(jsonPath("$.data.userAnswerText").isEmpty());

        // Kiểm tra xem database đã cập nhật kết quả đúng/sai chưa (isCorrect = true)
        com.aistudyhub.entity.UserQuizProgress updated = userQuizProgressRepository
                .findByTestIdAndQuestionId(test.getId(), choiceQuestion.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(updated.getIsCorrect());
    }

    @Test
    void submitAnswer_Success_FillInTheBlank() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Live Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        com.aistudyhub.entity.UserQuizProgress progress = com.aistudyhub.entity.UserQuizProgress.builder()
                .test(test)
                .question(fibQuestion)
                .build();
        userQuizProgressRepository.save(progress);

        // Đáp án đúng là "Query". Gửi lên đáp án có chữ thường, chữ hoa và khoảng trắng thừa
        String requestBody = "{\n" +
                "  \"questionId\": " + fibQuestion.getId() + ",\n" +
                "  \"userAnswerText\": \"  qUeRy  \"\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.selectedOptionId").isEmpty())
                .andExpect(jsonPath("$.data.userAnswerText").value("  qUeRy  "));

        // Kiểm tra xem database đã so khớp hoa thường, khoảng trắng thành công (isCorrect = true)
        com.aistudyhub.entity.UserQuizProgress updated = userQuizProgressRepository
                .findByTestIdAndQuestionId(test.getId(), fibQuestion.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(updated.getIsCorrect());
    }

    @Test
    void submitAnswer_TestNotFound() throws Exception {
        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": " + correctOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/99999/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Test not found"));
    }

    @Test
    void submitAnswer_AccessDenied() throws Exception {
        // Tạo bài test của user khác (creator)
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Creator's Test")
                .quiz(publicQuiz)
                .user(creator)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": " + correctOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this test"));
    }

    @Test
    void submitAnswer_TestAlreadyCompleted() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Completed Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.COMPLETED)
                .build();
        test = testRepository.save(test);

        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": " + correctOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Test has already been submitted"));
    }

    @Test
    void submitAnswer_QuestionNotFound() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Live Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        String requestBody = "{\n" +
                "  \"questionId\": 99999,\n" +
                "  \"selectedOptionId\": " + correctOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Question not found"));
    }

    @Test
    void submitAnswer_OptionNotFound() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Live Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        com.aistudyhub.entity.UserQuizProgress progress = com.aistudyhub.entity.UserQuizProgress.builder()
                .test(test)
                .question(choiceQuestion)
                .build();
        userQuizProgressRepository.save(progress);

        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": 99999\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Option not found"));
    }

    @Test
    void submitAnswer_OptionNotBelongingToQuestion() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Live Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        com.aistudyhub.entity.UserQuizProgress progress = com.aistudyhub.entity.UserQuizProgress.builder()
                .test(test)
                .question(choiceQuestion)
                .build();
        userQuizProgressRepository.save(progress);

        // Gửi fibCorrectOption (thuộc về fibQuestion) làm câu trả lời cho choiceQuestion
        String requestBody = "{\n" +
                "  \"questionId\": " + choiceQuestion.getId() + ",\n" +
                "  \"selectedOptionId\": " + fibCorrectOption.getId() + "\n" +
                "}";

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails(student)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Option not found"));
    }

    // =========================================================================
    // 3. API: GET /api/tests/{testId} (Xem chi tiết tiến trình làm bài - Resuming)
    // =========================================================================

    @Test
    void getTest_Success() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Resumed Test")
                .quiz(publicQuiz)
                .user(student)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        com.aistudyhub.entity.UserQuizProgress progress = com.aistudyhub.entity.UserQuizProgress.builder()
                .test(test)
                .question(choiceQuestion)
                .selectedOption(correctOption)
                .isCorrect(true)
                .build();
        userQuizProgressRepository.save(progress);

        mockMvc.perform(get("/api/tests/" + test.getId())
                .with(user(userDetails(student))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.questions[0].userProgress.selectedOptionId").value(correctOption.getId()))
                // Đảm bảo không lộ isCorrect trong tiến trình làm bài
                .andExpect(jsonPath("$.data.questions[0].userProgress.isCorrect").doesNotExist());
    }

    @Test
    void getTest_TestNotFound() throws Exception {
        mockMvc.perform(get("/api/tests/99999")
                .with(user(userDetails(student))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Test not found"));
    }

    @Test
    void getTest_AccessDenied() throws Exception {
        com.aistudyhub.entity.Test test = com.aistudyhub.entity.Test.builder()
                .title("Creator's Test")
                .quiz(publicQuiz)
                .user(creator)
                .status(TestStatus.IN_PROGRESS)
                .build();
        test = testRepository.save(test);

        mockMvc.perform(get("/api/tests/" + test.getId())
                .with(user(userDetails(student))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You don't have access to this test"));
    }
}
