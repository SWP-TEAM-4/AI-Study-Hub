package com.aistudyhub.module.quiz.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.QuizSelectionMode;
import com.aistudyhub.common.enums.TestStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.Test;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserQuizProgress;
import com.aistudyhub.module.quiz.dto.AnswerRequest;
import com.aistudyhub.module.quiz.dto.StartTestRequest;
import com.aistudyhub.module.quiz.dto.TestOptionResponse;
import com.aistudyhub.module.quiz.dto.TestQuestionResponse;
import com.aistudyhub.module.quiz.dto.TestResponse;
import com.aistudyhub.module.quiz.dto.UserAnswerResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.QuizOptionRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.TestRepository;
import com.aistudyhub.repository.UserQuizProgressRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestService {

    // khai bao các Repo cần dùng để truy vấn cơ sở dữ liệu
    private final TestRepository testRepository;
    private final UserQuizProgressRepository userQuizProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizOptionRepository quizOptionRepository;

    // lớp service của User để lấy thông tin người dùng hiện tại đang đăng nhập
    private final UserService userService;

    /***
     * bắt đầu test (lấy đề)
     * 
     * @param quizId nhận vào quizId của ngân hàng đề
     * @return TestResponse chứa thông tin bài test
     */
    @Transactional
    public TestResponse startTest(Long quizId, StartTestRequest request) {

        // 1. Lấy thông tin của user
        User currentUser = userService.getCurrentUser();

        // 2. Tìm quiz trong database theo quizId
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // 3. kiểm tra quyền tiếp cận quizz

        // nếu đề thi là PRIVATE và người dùng hiện tại không phải người tạo đề thì báo
        // lỗi
        if (quiz.getVisibility() == Visibility.PRIVATE && !quiz.getCreator().getId().equals(currentUser.getId())) {
            // ném lỗi
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        // 4. Taọ tiêu đề mặc định nếu FE không gửi lên
        String testTitle = request.getTitle();

        if (testTitle == null || testTitle.isBlank()) {
            // Dùng mặc định ngắn gọn hoặc định dạng lại ngày giờ
            testTitle = quiz.getTitle() + " - Lượt làm bài";
        } else {
            testTitle = testTitle.trim(); // Cắt bỏ khoảng trắng thừa 2 đầu
        }

        // 5. tạo đối tượng Test

        Test test = Test.builder()
                .title(testTitle)
                .user(currentUser)
                .quiz(quiz)
                .status(TestStatus.IN_PROGRESS)
                .duration(request.getDuration()) // số phút làm bài
                .build();

        // 6. lưu vào db
        test = testRepository.save(test);
        log.info("Test created successfully with id={} for quizId={}", test.getId(), quiz.getId());

        // Bước 6.5: Lấy danh sách câu hỏi theo selectionMode
        List<QuizQuestion> questions = new ArrayList<>();
        if (request.getQuizSelectionMode() == QuizSelectionMode.ALL) {
            questions = quizQuestionRepository.findByQuizIdOrderById(quizId);
        } else if (request.getQuizSelectionMode() == QuizSelectionMode.SELECTED) {
            List<Long> questionIds = request.getQuestionIds();
            // Lỗi 1: Nếu chọn chế độ SELECTED mà không gửi ID nào lên
            if (questionIds == null || questionIds.isEmpty()) {
                throw new AppException(ErrorCode.EMPTY_QUESTION_SELECTION);
            }
            List<QuizQuestion> dbQuestions = quizQuestionRepository.findAllById(questionIds);

            // Lỗi 2: Nếu số câu hỏi tìm thấy trong DB không khớp với số ID gửi lên,
            // hoặc có câu hỏi không thuộc về quizId này
            if (dbQuestions.size() != questionIds.size()) {
                throw new AppException(ErrorCode.QUESTION_NOT_IN_QUIZ);
            }
            for (QuizQuestion q : dbQuestions) {
                if (!q.getQuiz().getId().equals(quizId)) {
                    throw new AppException(ErrorCode.QUESTION_NOT_IN_QUIZ);
                }
            }
            questions = dbQuestions;
        } else if (request.getQuizSelectionMode() == QuizSelectionMode.RANDOM) {
            List<QuizQuestion> allQuestions = quizQuestionRepository.findByQuizIdOrderById(quizId);

            Integer randomCount = request.getRandomCount();
            if (randomCount == null || randomCount <= 0) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "randomCount must be greater than 0");
            }

            // Lỗi 3: Nếu số câu yêu cầu lớn hơn tổng số câu hỏi đang có trong ngân hàng đề
            if (randomCount > allQuestions.size()) {
                throw new AppException(ErrorCode.NOT_ENOUGH_QUESTIONS);
            }
            java.util.Collections.shuffle(allQuestions);
            questions = new ArrayList<>(allQuestions.subList(0, randomCount));
        }

        // Kiểm tra phòng vệ: Nếu đề thi cuối cùng trống rỗng thì báo lỗi ngay
        if (questions.isEmpty()) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }

        // Trộn thứ tự câu hỏi (nếu Frontend yêu cầu)
        if (Boolean.TRUE.equals(request.getShuffleQuestions())) {
            java.util.Collections.shuffle(questions);
        }

        // Bước 6.6: Lưu danh sách câu hỏi này vào DB (bảng user_quiz_progress) để khóa
        // đề
        for (QuizQuestion question : questions) {
            UserQuizProgress progress = UserQuizProgress.builder()
                    .test(test)
                    .question(question)
                    .build();
            userQuizProgressRepository.save(progress);
        }
        // 7. tạo TestResponse trả về cho FE
        List<TestQuestionResponse> questionResponses = new ArrayList<>();

        for (QuizQuestion question : questions) {
            // Map danh sách phương án lựa chọn option tương ứng của câu hỏi
            List<TestOptionResponse> optionResponses = new ArrayList<>();

            // Đáp án chuẩn của câu điền từ được lưu như một option ẩn để chấm điểm,
            // nhưng tuyệt đối không trả option này trong payload làm bài.
            if (question.getQuestionType() != QuestionType.FILL_IN_THE_BLANK) {
                for (QuizOption option : question.getOptions()) {
                    optionResponses.add(TestOptionResponse.builder()
                            .id(option.getId())
                            .optionText(option.getOptionText())
                            .build());
                }
            }

            // trộn thứ tự các phương án
            if (Boolean.TRUE.equals(request.getShuffleOptions())) {
                java.util.Collections.shuffle(optionResponses);
            }

            // Map thông tin câu hỏi

            questionResponses.add(TestQuestionResponse.builder()
                    .id(question.getId())
                    .questionText(question.getQuestionText())
                    .questionType(question.getQuestionType())
                    .options(optionResponses)
                    .userProgress(null) // Bài test mới bắt đầu nên chưa có câu trả lời nào
                    .build());
        }

        // Tạo đối tượng TestResponse chính để trả về cho Frontend
        TestResponse testResponse = TestResponse.builder()
                .id(test.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .userId(currentUser.getId())
                .title(test.getTitle())
                .totalScore(test.getTotalScore())
                .duration(test.getDuration())
                .status(test.getStatus())
                .createdAt(test.getCreatedAt())
                .questions(questionResponses)
                .selectionMode(request.getQuizSelectionMode())
                .randomCount(request.getRandomCount())
                .shuffleQuestions(request.getShuffleQuestions())
                .shuffleOptions(request.getShuffleOptions())
                .totalQuestions(questions.size())
                .build();

        return testResponse;

    }

    /**
     * Lấy chi tiết bài test hiện tại và các câu hỏi kèm câu trả lời đã lưu
     */
    public TestResponse getTest(Long testId) {

        // 1.Lấy thông tin User hiện tại
        User currentUser = userService.getCurrentUser();

        // 2.Timf bài test trong DB
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_NOT_FOUND));

        // 3. Kiểm tra bảo mật: Bài test phải thuộc về User hiện tại
        if (!test.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.TEST_ACCESS_DENIED);
        }

        // 4 Lấy danh sách câu hỏi và câu trả lời đã lưu của bài test này

        List<UserQuizProgress> progresses = userQuizProgressRepository.findByTestIdOrderById(testId);

        // 5. Map dữ liệu sang TestResponse
        List<TestQuestionResponse> questionResponses = new ArrayList<>();

        for (UserQuizProgress progress : progresses) {
            QuizQuestion question = progress.getQuestion();

            // Map danh sach Option cua cau hoi
            List<TestOptionResponse> optionResponses = new ArrayList<>();
            // Giữ cùng quy tắc với startTest: không làm lộ đáp án chuẩn khi resume.
            if (question.getQuestionType() != QuestionType.FILL_IN_THE_BLANK) {
                for (QuizOption option : question.getOptions()) {
                    optionResponses.add(TestOptionResponse.builder()
                            .id(option.getId())
                            .optionText(option.getOptionText())
                            .build());
                }
            }

            // Map tiến trình trả lời của user (nếu đã từng trả lời thì sẽ có dữ liệu)
            UserAnswerResponse userAnswerResponse = null;
            if (progress.getSelectedOption() != null || progress.getUserAnswerText() != null) {
                userAnswerResponse = UserAnswerResponse.builder()
                        .selectedOptionId(
                                progress.getSelectedOption() != null ? progress.getSelectedOption().getId() : null)
                        .userAnswerText(progress.getUserAnswerText())
                        .build();
            }

            // Map cau hoi

            questionResponses.add(TestQuestionResponse.builder()
                    .id(question.getId())
                    .questionText(question.getQuestionText())
                    .questionType(question.getQuestionType())
                    .options(optionResponses)
                    .userProgress(userAnswerResponse) // Đưa câu trả lời cũ vào đây
                    .build());

        }

        // Tạo TestResponse chính để trả về cho Frontend
        TestResponse testResponse = TestResponse.builder()
                .id(test.getId())
                .quizId(test.getQuiz().getId())
                .quizTitle(test.getQuiz().getTitle())
                .userId(currentUser.getId())
                .title(test.getTitle())
                .totalScore(test.getTotalScore())
                .duration(test.getDuration())
                .status(test.getStatus())
                .createdAt(test.getCreatedAt())
                .questions(questionResponses)
                .totalQuestions(progresses.size())
                .build();

        return testResponse;

    }

    /**
     * Submit câu trả lời của bài test
     */
    @Transactional
    public UserAnswerResponse submitAnswer(Long testId, AnswerRequest request) {

        // 1. Lấy user hiện tại
        User currentUser = userService.getCurrentUser();

        // 2. Tìm bài test
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_NOT_FOUND));

        // 3. Kiểm tra bảo mật (Bài test phải thuộc về user đang đăng nhập)
        if (!test.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.TEST_ACCESS_DENIED);
        }

        // 4. Kiểm tra trạng thái (Chỉ được sửa khi bài test đang làm)
        if (test.getStatus() == TestStatus.COMPLETED) {
            throw new AppException(ErrorCode.TEST_ALREADY_COMPLETED);
        }
        // 5. Tìm bản ghi tiến trình (UserQuizProgress) của câu hỏi này trong bài test
        UserQuizProgress progress = userQuizProgressRepository
                .findByTestIdAndQuestionId(testId, request.getQuestionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        // Lấy ra thông tin câu hỏi từ bản ghi tiến trình
        QuizQuestion question = progress.getQuestion();
        QuizOption selectedOption = null;
        Boolean isCorrect = false;

        // 6.Xử lý tính toán đáp án đúng/sai dựa trên loại câu hỏi
        if (question.getQuestionType() == QuestionType.SINGLE_CHOICE ||
                question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {

            // Đối với câu hỏi trắc nghiệm, bắt buộc phải chọn option
            if (request.getSelectedOptionId() == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }

            // Tìm option được chọn trong DB
            selectedOption = quizOptionRepository.findById(request.getSelectedOptionId())
                    .orElseThrow(() -> new AppException(ErrorCode.OPTION_NOT_FOUND));

            // Bảo mật: Option được chọn phải thuộc về câu hỏi này
            if (!selectedOption.getQuestion().getId().equals(question.getId())) {
                throw new AppException(ErrorCode.OPTION_NOT_FOUND);
            }

            isCorrect = selectedOption.getIsCorrect();

        } else if (question.getQuestionType() == QuestionType.FILL_IN_THE_BLANK) {

            // Đối với câu điền vào chỗ trống
            String userAnswerText = request.getUserAnswerText();
            if (userAnswerText == null) {
                userAnswerText = "";
            }

            // Tìm đáp án chính xác (option có is_correct = true) trong DB của câu hỏi này
            QuizOption correctOption = null;
            for (QuizOption option : question.getOptions()) {
                if (Boolean.TRUE.equals(option.getIsCorrect())) {
                    correctOption = option;
                    break;
                }
            }

            if (correctOption != null) {
                String cleanUserAnswer = userAnswerText.trim().toLowerCase();
                String cleanCorrectAnswer = correctOption.getOptionText() != null
                        ? correctOption.getOptionText().trim().toLowerCase()
                        : "";
                isCorrect = cleanUserAnswer.equalsIgnoreCase(cleanCorrectAnswer);
            }
        }
        // 7. Cập nhật câu trả lời và kết quả đúng/sai âm thầm vào DB
        // Thay vì lưu trực tiếp cả hai:
        progress.setSelectedOption(selectedOption);
        progress.setUserAnswerText(
                question.getQuestionType() == QuestionType.FILL_IN_THE_BLANK ? request.getUserAnswerText() : null);
        progress.setIsCorrect(isCorrect);
        userQuizProgressRepository.save(progress);

        // 8. Trả về thông tin đã lưu cho FE (không trả về trường isCorrect để tránh
        // gian lận)
        return UserAnswerResponse.builder()
                .selectedOptionId(selectedOption != null ? selectedOption.getId() : null)
                .userAnswerText(progress.getUserAnswerText()) // Lấy từ progress để đồng bộ với DB
                .build();
    }

}
