package com.aistudyhub.module.quiz.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
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

import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuizTimedMultipleChoiceFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizQuestionRepository quizQuestionRepository;
    @Autowired private QuizOptionRepository quizOptionRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private UserQuizProgressRepository progressRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager entityManager;

    private User student;
    private Quiz quiz;
    private QuizQuestion question;
    private QuizOption correctA;
    private QuizOption correctC;
    private QuizOption wrongB;

    @BeforeEach
    void setUp() {
        progressRepository.deleteAll();
        testRepository.deleteAll();
        quizOptionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        userRepository.deleteAll();

        student = userRepository.save(User.builder()
                .email("timed-multiple-choice@student.test")
                .fullName("Timed Quiz Student")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
        quiz = quizRepository.save(Quiz.builder()
                .creator(student)
                .title("Multiple Choice Quiz")
                .visibility(Visibility.PRIVATE)
                .build());
        question = quizQuestionRepository.save(QuizQuestion.builder()
                .quiz(quiz)
                .questionText("Select every correct Spring stereotype")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .build());
        correctA = quizOptionRepository.save(option("@Component", true));
        wrongB = quizOptionRepository.save(option("@BeanFactory", false));
        correctC = quizOptionRepository.save(option("@Service", true));
        question.setOptions(new ArrayList<>(List.of(correctA, wrongB, correctC)));
        question = quizQuestionRepository.save(question);
    }

    @Test
    void startTest_DefaultsDurationAndReturnsServerDeadline() throws Exception {
        mockMvc.perform(post("/api/quizzes/" + quiz.getId() + "/tests")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.duration").value(30))
                .andExpect(jsonPath("$.data.expiresAt").isNotEmpty());
    }

    @Test
    void multipleChoice_ExactSetIsCorrectAndReturnedInResult() throws Exception {
        com.aistudyhub.entity.Test test = createTest(30);
        createProgress(test);

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(answerJson(correctC.getId(), correctA.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedOptionId").isEmpty())
                .andExpect(jsonPath("$.data.selectedOptionIds.length()").value(2));

        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"confirmSubmit\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correctAnswers").value(1))
                .andExpect(jsonPath("$.data.totalScore").value(10.0))
                .andExpect(jsonPath("$.data.items[0].selectedOptionIds.length()").value(2));
    }

    @Test
    void multipleChoice_SubsetIsIncorrect() throws Exception {
        com.aistudyhub.entity.Test test = createTest(30);
        createProgress(test);

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(answerJson(correctA.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/tests/" + test.getId() + "/submit")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"confirmSubmit\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correctAnswers").value(0))
                .andExpect(jsonPath("$.data.totalScore").value(0.0));
    }

    @Test
    void saveAnswer_AfterDeadlineIsRejected() throws Exception {
        com.aistudyhub.entity.Test test = createTest(1);
        createProgress(test);
        jdbcTemplate.update(
                "UPDATE tests SET created_at = ? WHERE id = ?",
                Timestamp.valueOf(LocalDateTime.now().minusMinutes(2)),
                test.getId());
        entityManager.clear();

        mockMvc.perform(post("/api/tests/" + test.getId() + "/answers")
                .with(user(userDetails()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(answerJson(correctA.getId(), correctC.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Test time has expired"));
    }

    private QuizOption option(String text, boolean correct) {
        return QuizOption.builder()
                .question(question)
                .optionText(text)
                .isCorrect(correct)
                .build();
    }

    private com.aistudyhub.entity.Test createTest(int duration) {
        return testRepository.save(com.aistudyhub.entity.Test.builder()
                .quiz(quiz)
                .user(student)
                .title("Timed attempt")
                .duration(duration)
                .status(TestStatus.IN_PROGRESS)
                .build());
    }

    private void createProgress(com.aistudyhub.entity.Test test) {
        progressRepository.save(UserQuizProgress.builder()
                .test(test)
                .question(question)
                .build());
    }

    private CustomUserDetails userDetails() {
        return new CustomUserDetails(student);
    }

    private String answerJson(Long... optionIds) {
        return "{\"questionId\":" + question.getId()
                + ",\"selectedOptionIds\":["
                + java.util.Arrays.stream(optionIds).map(String::valueOf).collect(java.util.stream.Collectors.joining(","))
                + "]}";
    }
}
