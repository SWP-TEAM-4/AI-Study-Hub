package com.aistudyhub.module.quiz.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.aistudyhub.common.enums.TestStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.Test;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserQuizProgress;
import com.aistudyhub.module.quiz.dto.OptionResponse;
import com.aistudyhub.module.quiz.dto.SubmitTestRequest;
import com.aistudyhub.module.quiz.dto.TestResultItemResponse;
import com.aistudyhub.module.quiz.dto.TestResultResponse;
import com.aistudyhub.module.quiz.dto.UserTestHistoryResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.TestRepository;
import com.aistudyhub.repository.UserQuizProgressRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service chuyên biệt xử lý các nghiệp vụ sau khi thi:
 * 1. Nộp bài thi & Chấm điểm.
 * 2. Xem kết quả chi tiết của lượt thi đã hoàn thành.
 * 3. Truy vấn lịch sử thi của người dùng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TestResultService {

    // Khai báo các Repository cần dùng để tương tác với database
    private final TestRepository testRepository;
    private final UserQuizProgressRepository userQuizProgressRepository;

    // Service của User để lấy thông tin tài khoản đang đăng nhập
    private final UserService userService;

    /**
     * Thực hiện nộp bài thi, tự động đánh dấu sai cho các câu bỏ trống,
     * tính điểm trên thang 10.0 và cập nhật trạng thái bài thi thành COMPLETED.
     *
     * @param testId  ID của lượt thi cần nộp bài
     * @param request thông tin xác nhận nộp bài
     * @return TestResultResponse chứa điểm số tổng quan và đáp án chi tiết từng câu
     */
    @Transactional
    public TestResultResponse submitTest(Long testId, SubmitTestRequest request) {
        // 1. Lấy thông tin user hiện tại đang đăng nhập từ hệ thống
        User currentUser = userService.getCurrentUser();

        // 2. Tìm bài test trong Database. Nếu không thấy, ném lỗi 404
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_NOT_FOUND));

        // 3. Bảo mật: Chỉ người làm bài test này mới có quyền nộp bài
        if (!test.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.TEST_ACCESS_DENIED);
        }

        // 4. Lấy danh sách toàn bộ các câu hỏi đã được khóa trong lượt thi này
        List<UserQuizProgress> progresses = userQuizProgressRepository.findByTestIdOrderById(testId);

        // 5. Nghiệp vụ: Nếu bài thi đã ở trạng thái COMPLETED từ trước, trả về luôn kết
        // quả cũ (đáp ứng AC không chấm lại)
        if (test.getStatus() == TestStatus.COMPLETED) {
            log.info("Test id={} already completed. Returning cached result.", testId);
            return buildTestResultResponse(test, progresses);
        }

        // 6. Duyệt qua danh sách câu hỏi để chấm điểm và xử lý những câu hỏi bỏ trống
        int correctCount = 0;
        for (UserQuizProgress progress : progresses) {
            // Nếu câu này chưa được trả lời (isCorrect = null), ta coi như học sinh làm sai
            if (progress.getIsCorrect() == null) {
                progress.setIsCorrect(false);
                userQuizProgressRepository.save(progress); // Lưu trạng thái sai xuống Database
            }
            // Đếm số lượng câu trả lời đúng
            if (Boolean.TRUE.equals(progress.getIsCorrect())) {
                correctCount++;
            }
        }

        // 7. Tính tổng điểm của bài thi trên thang điểm 10
        BigDecimal totalScore = BigDecimal.ZERO;
        if (!progresses.isEmpty()) {
            double rawScore = ((double) correctCount / progresses.size()) * 10.0;
            // Làm tròn đến 2 chữ số thập phân bằng chế độ HALF_UP (ví dụ: 8.3333... thành
            // 8.33)
            totalScore = BigDecimal.valueOf(rawScore).setScale(2, RoundingMode.HALF_UP);
        }

        // 8. Cập nhật kết quả điểm số và đổi status của bài thi sang COMPLETED
        test.setTotalScore(totalScore);
        test.setStatus(TestStatus.COMPLETED);
        testRepository.save(test); // Lưu cập nhật của bài test xuống Database

        log.info("Test id={} submitted successfully. Score: {}", testId, totalScore);

        // 9. Dựng và trả kết quả thi chi tiết cho Client
        return buildTestResultResponse(test, progresses);
    }

    /**
     * Tra cứu kết quả chấm điểm chi tiết của một bài thi đã hoàn thành.
     *
     * @param testId ID của bài thi
     * @return TestResultResponse chứa thông tin điểm số và lời giải chi tiết
     */
    public TestResultResponse getTestResult(Long testId) {
        // 1. Lấy thông tin user hiện tại
        User currentUser = userService.getCurrentUser();

        // 2. Tìm bài test trong DB
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new AppException(ErrorCode.TEST_NOT_FOUND));

        // 3. Bảo mật: Lượt thi này phải thuộc về user đang đăng nhập
        if (!test.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.TEST_ACCESS_DENIED);
        }

        // 4. Nghiệp vụ: Chỉ cho phép xem điểm khi bài thi đã nộp (status = COMPLETED)
        if (test.getStatus() != TestStatus.COMPLETED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Test is still in progress");
        }

        // 5. Lấy danh sách tiến trình chi tiết từ DB và trả về kết quả
        List<UserQuizProgress> progresses = userQuizProgressRepository.findByTestIdOrderById(testId);
        return buildTestResultResponse(test, progresses);
    }

    /**
     * Lấy lịch sử các lượt làm bài thi của người dùng hiện tại (hỗ trợ phân trang,
     * tìm kiếm và sắp xếp).
     *
     * @param page    trang hiện tại (bắt đầu từ 0)
     * @param size    số lượng bản ghi trên một trang
     * @param keyword từ khóa tìm kiếm trong tiêu đề bài thi (null hoặc trống nếu
     *                không tìm kiếm)
     * @param sort    kiểu sắp xếp ("newest" - mới nhất trước, hoặc "oldest" - cũ
     *                nhất trước)
     * @return PaginationResponse chứa danh sách lịch sử thi của user
     */
    public PaginationResponse<UserTestHistoryResponse> getUserTestHistory(int page, int size, String keyword,
            String sort) {
        // 1. Lấy user đang đăng nhập
        User currentUser = userService.getCurrentUser();

        // 2. Xác định chiều sắp xếp dựa trên ngày tạo (createdAt)
        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        // 3. Truy vấn dữ liệu phân trang từ Database
        Page<Test> testPage;
        if (keyword != null && !keyword.isBlank()) {
            testPage = testRepository.findByUserIdAndTitleContainingIgnoreCase(currentUser.getId(), keyword.trim(),
                    pageable);
        } else {
            testPage = testRepository.findByUserId(currentUser.getId(), pageable);
        }

        // 4. Chuyển đổi (map) danh sách Test Entity sang UserTestHistoryResponse DTO
        Page<UserTestHistoryResponse> historyPage = testPage.map(this::toUserTestHistoryResponse);

        // 5. Bọc vào đối tượng phân trang chuẩn của hệ thống và trả về
        return PaginationResponse.of(historyPage);
    }

    /**
     * Helper dựng DTO kết quả thi chi tiết từ Test entity và danh sách
     * UserQuizProgress.
     * Tận dụng lại cho cả hàm submitTest và getTestResult (tránh lặp code - DRY).
     */
    private TestResultResponse buildTestResultResponse(Test test, List<UserQuizProgress> progresses) {
        int correctCount = 0;
        List<TestResultItemResponse> items = new ArrayList<>();

        for (UserQuizProgress progress : progresses) {
            QuizQuestion question = progress.getQuestion();
            List<OptionResponse> options = question.getOptions().stream()
                    .map(option -> OptionResponse.builder()
                            .id(option.getId())
                            .optionText(option.getOptionText())
                            .isCorrect(option.getIsCorrect())
                            .build())
                    .toList();

            // Đếm số câu đúng
            if (Boolean.TRUE.equals(progress.getIsCorrect())) {
                correctCount++;
            }

            // Map tiến trình câu hỏi sang DTO kết quả chi tiết từng câu
            // Lưu ý: Trường selectedOptionId được gán đúng để khớp với
            // TestResultItemResponse.java
            items.add(TestResultItemResponse.builder()
                    .questionId(question.getId())
                    .questionText(question.getQuestionText())
                    .questionType(question.getQuestionType())
                    .isCorrect(progress.getIsCorrect() != null ? progress.getIsCorrect() : false)
                    .selectedOptionId(
                            progress.getSelectedOption() != null ? progress.getSelectedOption().getId() : null)
                    // Chỉ trả về userAnswerText nếu câu hỏi là FILL_IN_THE_BLANK. Nếu là trắc
                    // nghiệm, bắt buộc trả về null.
                    .userAnswerText(question
                            .getQuestionType() == com.aistudyhub.common.enums.QuestionType.FILL_IN_THE_BLANK
                                    ? progress.getUserAnswerText()
                                    : null)
                    .explanation(question.getExplanation()) // Lấy giải thích từ đề gốc
                    .options(options)
                    .build());
        }

        return TestResultResponse.builder()
                .testId(test.getId())
                .quizId(test.getQuiz().getId())
                .totalScore(test.getTotalScore())
                .correctAnswers(correctCount)
                .totalQuestions(progresses.size())
                .status(test.getStatus())
                .items(items)
                .build();
    }

    /**
     * Helper chuyển đổi Test entity sang UserTestHistoryResponse DTO.
     */
    private UserTestHistoryResponse toUserTestHistoryResponse(Test test) {
        return UserTestHistoryResponse.builder()
                .id(test.getId())
                .quizId(test.getQuiz().getId())
                .userId(test.getUser().getId())
                .title(test.getTitle())
                .totalScore(test.getTotalScore())
                .duration(test.getDuration())
                .status(test.getStatus())
                .createdAt(test.getCreatedAt())
                .build();
    }
}
