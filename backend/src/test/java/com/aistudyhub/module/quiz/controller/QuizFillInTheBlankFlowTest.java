package com.aistudyhub.module.quiz.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.QuizOptionRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.TestRepository;
import com.aistudyhub.repository.UserQuizProgressRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration tests for the complete FILL_IN_THE_BLANK lifecycle:
 * question management, test delivery without answer leakage, answer grading,
 * and final scoring.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class QuizFillInTheBlankFlowTest {

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

    private User owner;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        userQuizProgressRepository.deleteAll();
        testRepository.deleteAll();
        quizOptionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .email("fill-blank-owner@aistudyhub.com")
                .fullName("Fill Blank Owner")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        quiz = quizRepository.save(Quiz.builder()
                .creator(owner)
                .title("Spring Fill Blank Quiz")
                .visibility(Visibility.PRIVATE)
                .build());
    }

    private CustomUserDetails userDetails() {
        return new CustomUserDetails(owner);
    }

    @Test
    void fillBlank_FullLifecycle_GradesCorrectAnswerWithoutLeakingIt() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Spring annotations test",
                                  "quizSelectionMode": "ALL",
                                  "shuffleQuestions": false,
                                  "shuffleOptions": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.questions[0].questionType").value("FILL_IN_THE_BLANK"))
                .andExpect(jsonPath("$.data.questions[0].options").isEmpty());

        com.aistudyhub.entity.Test test = testRepository.findAll().get(0);

        mockMvc.perform(get("/api/tests/{testId}", test.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions[0].options").isEmpty());

        mockMvc.perform(post("/api/tests/{testId}/answers", test.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "userAnswerText": "  @cOmPoNeNt  "
                                }
                                """.formatted(question.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedOptionId").isEmpty())
                .andExpect(jsonPath("$.data.userAnswerText").value("  @cOmPoNeNt  "));

        assertTrue(userQuizProgressRepository
                .findByTestIdAndQuestionId(test.getId(), question.getId())
                .orElseThrow()
                .getIsCorrect());

        mockMvc.perform(post("/api/tests/{testId}/submit", test.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirmSubmit\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalScore").value(10.0))
                .andExpect(jsonPath("$.data.correctAnswers").value(1))
                .andExpect(jsonPath("$.data.items[0].isCorrect").value(true));
    }

    @Test
    void addFillBlank_RejectsEmptyOptions() throws Exception {
        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("[]")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void addFillBlank_RejectsMultipleOrNonCorrectOptions() throws Exception {
        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("""
                                [
                                  { "optionText": "@Component", "isCorrect": true },
                                  { "optionText": "@Bean", "isCorrect": true }
                                ]
                                """)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("""
                                [{ "optionText": "@Component", "isCorrect": false }]
                                """)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void addFillBlank_RejectsBlankCorrectAnswer() throws Exception {
        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("""
                                [{ "optionText": "   ", "isCorrect": true }]
                                """)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void updateFillBlank_ReplacesTheStoredCorrectAnswer() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);
        Long optionId = question.getOptions().get(0).getId();

        mockMvc.perform(put("/api/questions/{questionId}", question.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionText": "Annotation chuyên dùng cho service là ______",
                                  "questionType": "FILL_IN_THE_BLANK",
                                  "explanation": "Service stereotype",
                                  "options": [
                                    { "id": %d, "optionText": "@Service", "isCorrect": true }
                                  ]
                                }
                                """.formatted(optionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.options.length()").value(1))
                .andExpect(jsonPath("$.data.options[0].optionText").value("@Service"))
                .andExpect(jsonPath("$.data.options[0].isCorrect").value(true));

        QuizQuestion updated = quizQuestionRepository.findById(question.getId()).orElseThrow();
        assertEquals(1, updated.getOptions().size());
        assertEquals("@Service", updated.getOptions().get(0).getOptionText());
    }

    @Test
    void fillBlank_WrongAnswerIsStoredAsIncorrect() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated());

        com.aistudyhub.entity.Test test = testRepository.findAll().get(0);
        mockMvc.perform(post("/api/tests/{testId}/answers", test.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "userAnswerText": "@Repository"
                                }
                                """.formatted(question.getId())))
                .andExpect(status().isOk());

        assertFalse(userQuizProgressRepository
                .findByTestIdAndQuestionId(test.getId(), question.getId())
                .orElseThrow()
                .getIsCorrect());
    }

    @Test
    void startTest_SelectedAndRandom_ReturnOnlyTheRequestedQuestions() throws Exception {
        createFillBlankQuestion("@Component");
        createFillBlankQuestion("@Service");
        createFillBlankQuestion("@Repository");
        var questions = quizQuestionRepository.findByQuizIdOrderById(quiz.getId());

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "quizSelectionMode": "SELECTED",
                                  "questionIds": [%d],
                                  "shuffleQuestions": false
                                }
                                """.formatted(questions.get(1).getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.questions.length()").value(1))
                .andExpect(jsonPath("$.data.questions[0].id").value(questions.get(1).getId()));

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "quizSelectionMode": "RANDOM",
                                  "randomCount": 2,
                                  "shuffleQuestions": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.questions.length()").value(2));
    }

    @Test
    void deleteQuestion_UnusedQuestion_HidesItButPreservesStoredData() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);
        Long optionId = question.getOptions().get(0).getId();

        mockMvc.perform(delete("/api/questions/{questionId}", question.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertTrue(quizQuestionRepository.existsById(question.getId()));
        assertTrue(quizQuestionRepository.findById(question.getId()).orElseThrow().getDeletedAt() != null);
        assertTrue(quizOptionRepository.existsById(optionId));
        assertTrue(quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).isEmpty());

        mockMvc.perform(get("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());

        mockMvc.perform(put("/api/questions/{questionId}", question.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("[{ \"optionText\": \"@Service\", \"isCorrect\": true }]")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("QUESTION_NOT_FOUND"));

        mockMvc.perform(delete("/api/questions/{questionId}", question.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk());
    }

    @Test
    void deleteQuestion_QuestionUsedInTest_HidesItAndPreservesDetailedResult() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);
        Long optionId = question.getOptions().get(0).getId();

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/questions/{questionId}", question.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk());

        assertTrue(quizQuestionRepository.existsById(question.getId()));
        assertTrue(quizOptionRepository.existsById(optionId));
        assertTrue(userQuizProgressRepository.existsByQuestionId(question.getId()));
        assertTrue(quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).isEmpty());

        com.aistudyhub.entity.Test test = testRepository.findAll().get(0);
        mockMvc.perform(post("/api/tests/{testId}/answers", test.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "userAnswerText": "@Component"
                                }
                                """.formatted(question.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/tests/{testId}/submit", test.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirmSubmit\":true}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tests/{testId}/result", test.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].questionText").value(question.getQuestionText()))
                .andExpect(jsonPath("$.data.items[0].options[0].optionText").value("@Component"))
                .andExpect(jsonPath("$.data.items[0].options[0].isCorrect").value(true));
    }

    @Test
    void startTest_DeletedQuestion_IsExcludedFromAllSelectionModes() throws Exception {
        createFillBlankQuestion("@Component");
        createFillBlankQuestion("@Service");
        var questions = quizQuestionRepository.findByQuizIdOrderById(quiz.getId());
        Long deletedQuestionId = questions.get(0).getId();

        mockMvc.perform(delete("/api/questions/{questionId}", deletedQuestionId)
                        .with(user(userDetails())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.questions.length()").value(1));

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "quizSelectionMode": "SELECTED",
                                  "questionIds": [%d]
                                }
                                """.formatted(deletedQuestionId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("QUESTION_NOT_IN_QUIZ"));

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"RANDOM\",\"randomCount\":2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("NOT_ENOUGH_QUESTIONS"));
    }

    @Test
    void deleteTest_OwnAttempt_DeletesProgressButKeepsQuizQuestion() throws Exception {
        createFillBlankQuestion("@Component");
        QuizQuestion question = quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).get(0);

        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated());

        com.aistudyhub.entity.Test test = testRepository.findAll().get(0);
        mockMvc.perform(delete("/api/tests/{testId}", test.getId())
                        .with(user(userDetails())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(testRepository.existsById(test.getId()));
        assertFalse(userQuizProgressRepository.existsByQuestionId(question.getId()));
        assertTrue(quizQuestionRepository.existsById(question.getId()));
    }

    @Test
    void deleteTest_OtherUsersAttempt_ReturnsForbidden() throws Exception {
        createFillBlankQuestion("@Component");
        mockMvc.perform(post("/api/quizzes/{quizId}/tests", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizSelectionMode\":\"ALL\"}"))
                .andExpect(status().isCreated());

        com.aistudyhub.entity.Test test = testRepository.findAll().get(0);
        User otherUser = userRepository.save(User.builder()
                .email("other-history-user@aistudyhub.com")
                .fullName("Other History User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        mockMvc.perform(delete("/api/tests/{testId}", test.getId())
                        .with(user(new CustomUserDetails(otherUser))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("TEST_ACCESS_DENIED"));

        assertTrue(testRepository.existsById(test.getId()));
    }

    private void createFillBlankQuestion(String correctAnswer) throws Exception {
        mockMvc.perform(post("/api/quizzes/{quizId}/questions", quiz.getId())
                        .with(user(userDetails()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fillBlankPayload("""
                                [{ "optionText": "%s", "isCorrect": true }]
                                """.formatted(correctAnswer))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.options.length()").value(1))
                .andExpect(jsonPath("$.data.options[0].optionText").value(correctAnswer));
    }

    private String fillBlankPayload(String optionsJson) {
        return """
                {
                  "questionText": "Annotation để khai báo Spring Bean là ______",
                  "questionType": "FILL_IN_THE_BLANK",
                  "explanation": "Spring stereotype annotation",
                  "options": %s
                }
                """.formatted(optionsJson);
    }
}
