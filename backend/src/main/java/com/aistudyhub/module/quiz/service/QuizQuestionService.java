package com.aistudyhub.module.quiz.service;

import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.module.quiz.dto.OptionRequest;
import com.aistudyhub.module.quiz.dto.OptionResponse;
import com.aistudyhub.module.quiz.dto.QuestionRequest;
import com.aistudyhub.module.quiz.dto.QuestionResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ logic nghiệp vụ liên quan đến Câu hỏi (QuizQuestion)
 * và Đáp án (QuizOption) của một Quiz.
 * Owner: BE3
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizQuestionService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserService userService;

    // ──────────────────────────────────────────────────────────────────────────
    // PUBLIC API METHODS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Thêm một câu hỏi kèm danh sách đáp án vào một Quiz.
     * Chỉ người tạo Quiz (creator) mới được thực hiện.
     *
     * @param quizId  ID của Quiz cần thêm câu hỏi
     * @param request dữ liệu câu hỏi và danh sách đáp án
     * @return DTO thông tin câu hỏi sau khi lưu
     * @throws AppException QUIZ_NOT_FOUND nếu không tìm thấy Quiz,
     *                      QUIZ_ACCESS_DENIED nếu user không phải creator
     */
    @Transactional
    public QuestionResponse addQuestion(Long quizId, QuestionRequest request) {
        Long currentUserId = userService.getCurrentUserId();
        Quiz quiz = findQuizOrThrow(quizId);
        validateCreatorOwnership(quiz, currentUserId);
        validateOptionsForType(request);

        QuizQuestion question = buildQuestion(quiz, request);
        question = quizQuestionRepository.save(question);

        log.info("Question id={} added to quizId={} by userId={}", question.getId(), quizId, currentUserId);
        return toQuestionResponse(question);
    }

    /**
     * Lấy toàn bộ danh sách câu hỏi (kèm đáp án) của một Quiz.
     * Nếu Quiz ở trạng thái PRIVATE, chỉ creator mới xem được.
     *
     * @param quizId ID của Quiz cần lấy câu hỏi
     * @return danh sách câu hỏi sắp xếp theo thứ tự tạo
     * @throws AppException QUIZ_NOT_FOUND nếu không tìm thấy Quiz,
     *                      QUIZ_ACCESS_DENIED nếu Quiz là PRIVATE và user không
     *                      phải creator
     */
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long quizId) {
        Long currentUserId = userService.getCurrentUserId();
        Quiz quiz = findQuizOrThrow(quizId);

        // Kiểm tra quyền xem
        if (quiz.getVisibility() == Visibility.PRIVATE
                && !quiz.getCreator().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        return quizQuestionRepository.findByQuizIdOrderById(quizId)
                .stream()
                .map(this::toQuestionResponse)
                .toList();
    }

    /**
     * Cập nhật nội dung câu hỏi và danh sách đáp án.
     * Xử lý thông minh: thêm option mới, cập nhật option cũ, xóa option không còn
     * trong request.
     * Chỉ creator của Quiz mới được thực hiện.
     *
     * @param questionId ID của câu hỏi cần cập nhật
     * @param request    dữ liệu cập nhật mới
     * @return DTO thông tin câu hỏi sau khi cập nhật
     * @throws AppException QUESTION_NOT_FOUND nếu không tìm thấy câu hỏi,
     *                      QUIZ_ACCESS_DENIED nếu user không phải creator
     */
    @Transactional
    public QuestionResponse updateQuestion(Long questionId, QuestionRequest request) {
        Long currentUserId = userService.getCurrentUserId();
        QuizQuestion question = findQuestionOrThrow(questionId);
        validateCreatorOwnership(question.getQuiz(), currentUserId);
        validateOptionsForType(request);

        // Cập nhật thông tin câu hỏi
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setExplanation(request.getExplanation());

        // Cập nhật options thông minh (tránh xóa toàn bộ rồi tạo lại)
        syncOptions(question, request.getOptions());

        question = quizQuestionRepository.save(question);
        log.info("Question id={} updated by userId={}", questionId, currentUserId);
        return toQuestionResponse(question);
    }

    /**
     * Xóa một câu hỏi khỏi Quiz (cascade tự động xóa toàn bộ đáp án liên quan).
     * Chỉ creator của Quiz mới được thực hiện.
     *
     * @param questionId ID của câu hỏi cần xóa
     * @throws AppException QUESTION_NOT_FOUND nếu không tìm thấy câu hỏi,
     *                      QUIZ_ACCESS_DENIED nếu user không phải creator
     */
    @Transactional
    public void deleteQuestion(Long questionId) {
        Long currentUserId = userService.getCurrentUserId();
        QuizQuestion question = findQuestionOrThrow(questionId);
        validateCreatorOwnership(question.getQuiz(), currentUserId);

        quizQuestionRepository.delete(question);
        log.info("Question id={} deleted by userId={}", questionId, currentUserId);
    }

    /**
     * Thêm hàng loạt câu hỏi vào một Quiz trong một transaction duy nhất.
     * Phương thức này để ngỏ cho module AI (BE2) tái sử dụng mà không cần sửa code
     * hiện tại.
     *
     * @param quizId   ID của Quiz cần thêm câu hỏi
     * @param requests danh sách câu hỏi cần thêm
     * @return danh sách DTO sau khi lưu
     */
    @Transactional
    public List<QuestionResponse> addQuestions(Long quizId, List<QuestionRequest> requests) {
        return requests.stream()
                .map(req -> addQuestion(quizId, req))
                .toList();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    private Quiz findQuizOrThrow(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
    }

    private QuizQuestion findQuestionOrThrow(Long questionId) {
        return quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
    }

    private void validateCreatorOwnership(Quiz quiz, Long currentUserId) {
        if (!quiz.getCreator().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
    }

    /**
     * Validate số lượng option và phải có ít nhất 1 đáp án đúng
     * đối với loại câu hỏi trắc nghiệm.
     */
    private void validateOptionsForType(QuestionRequest request) {
        QuestionType type = request.getQuestionType();
        List<OptionRequest> options = request.getOptions();

        if (type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE) {
            if (options == null || options.size() < 2) {
                throw new AppException(ErrorCode.VALIDATION_ERROR,
                        "SINGLE_CHOICE and MULTIPLE_CHOICE questions require at least 2 options");
            }
            boolean hasCorrectOption = options.stream()
                    .anyMatch(o -> Boolean.TRUE.equals(o.getIsCorrect()));
            if (!hasCorrectOption) {
                throw new AppException(ErrorCode.VALIDATION_ERROR,
                        "At least one option must be marked as correct");
            }
        }
    }

    /**
     * Build entity QuizQuestion từ request, kèm danh sách QuizOption.
     */
    private QuizQuestion buildQuestion(Quiz quiz, QuestionRequest request) {
        QuizQuestion question = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(request.getQuestionText().trim())
                .questionType(request.getQuestionType())
                .explanation(request.getExplanation())
                .options(new ArrayList<>())
                .build();

        for (OptionRequest optReq : request.getOptions()) {
            QuizOption option = QuizOption.builder()
                    .question(question)
                    .optionText(optReq.getOptionText().trim())
                    .isCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()))
                    .build();
            question.getOptions().add(option);
        }
        return question;
    }

    /**
     * Đồng bộ danh sách options của một câu hỏi với request mới.
     * - Option có id trong request → cập nhật
     * - Option không có id → tạo mới
     * - Option cũ không còn trong request → tự động xóa nhờ orphanRemoval
     */
    private void syncOptions(QuizQuestion question, List<OptionRequest> optionRequests) {
        // Map các option hiện tại theo id để tra cứu nhanh
        Map<Long, QuizOption> existingOptionsById = question.getOptions().stream()
                .filter(o -> o.getId() != null)
                .collect(Collectors.toMap(QuizOption::getId, o -> o));

        List<QuizOption> updatedOptions = new ArrayList<>();

        for (OptionRequest optReq : optionRequests) {
            if (optReq.getId() != null && existingOptionsById.containsKey(optReq.getId())) {
                // Cập nhật option đã tồn tại
                QuizOption existing = existingOptionsById.get(optReq.getId());
                existing.setOptionText(optReq.getOptionText().trim());
                existing.setIsCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()));
                updatedOptions.add(existing);
            } else {
                // Tạo option mới
                QuizOption newOption = QuizOption.builder()
                        .question(question)
                        .optionText(optReq.getOptionText().trim())
                        .isCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()))
                        .build();
                updatedOptions.add(newOption);
            }
        }

        // Xóa các option cũ không còn trong danh sách (orphanRemoval sẽ DELETE chúng)
        question.getOptions().clear();
        question.getOptions().addAll(updatedOptions);
    }

    /**
     * Chuyển đổi entity QuizQuestion → DTO QuestionResponse (bao gồm options).
     */
    private QuestionResponse toQuestionResponse(QuizQuestion question) {
        List<OptionResponse> optionResponses = question.getOptions().stream()
                .map(opt -> OptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .isCorrect(opt.getIsCorrect())
                        .build())
                .toList();

        return QuestionResponse.builder()
                .id(question.getId())
                .quizId(question.getQuiz().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .options(optionResponses)
                .build();
    }
}
