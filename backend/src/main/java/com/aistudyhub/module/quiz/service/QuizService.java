package com.aistudyhub.module.quiz.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.quiz.dto.QuizRequest;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizSearchRequest;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service xử lý toàn bộ logic nghiệp vụ liên quan đến Quiz (Đề thi).
 * Owner: BE3
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final NotebookRepository notebookRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final UserService userService;

    /**
     * Tạo một Quiz mới thuộc về người dùng hiện tại đăng nhập.
     * <p>
     * Hàm này thực hiện các bước validation quan trọng:
     * 1. Xác thực sự tồn tại của Notebook và kiểm tra xem người dùng có sở hữu Notebook đó không.
     * 2. Xác thực sự tồn tại của môn học (Subject) và kỳ học (Semester).
     * 
     * @param request dữ liệu cấu hình Quiz từ client
     * @return DTO thông tin Quiz sau khi đã lưu vào database
     * @throws AppException lỗi NOTEBOOK_NOT_FOUND nếu không tìm thấy notebook,
     *                      NOTEBOOK_ACCESS_DENIED nếu notebook không thuộc sở hữu của user đăng nhập,
     *                      SUBJECT_NOT_FOUND nếu không tìm thấy môn học,
     *                      SEMESTER_NOT_FOUND nếu không tìm thấy học kỳ.
     */
    @Transactional
    public QuizResponse createQuiz(QuizRequest request) {
        User currentUser = userService.getCurrentUser();

        Notebook notebook = null;
        if (request.getNotebookId() != null) {
            notebook = notebookRepository.findById(request.getNotebookId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
            // Validate notebook ownership
            if (!notebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        Semester academicTerm = null;
        if (request.getAcademicTermId() != null) {
            academicTerm = semesterRepository.findById(request.getAcademicTermId())
                .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND));
        }

        Quiz quiz = Quiz.builder()
            .title(request.getTitle().trim())
            .description(request.getDescription())
            .notebook(notebook)
            .subject(subject)
            .academicTerm(academicTerm)
            .examType(request.getExamType())
            .creator(currentUser)
            .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PRIVATE)
            .marketStatus(MarketStatus.NONE)
            .downloadCount(0)
            .reviewCount(0)
            .acceptPercentage(BigDecimal.ZERO)
            .build();

        quiz = quizRepository.save(quiz);
        log.info("Quiz created successfully with id={} by userId={}", quiz.getId(), currentUser.getId());
        return toQuizResponse(quiz);
    }

    /**
     * Lấy thông tin chi tiết của một Quiz theo ID.
     * <p>
     * Logic phân quyền truy cập:
     * - Nếu Quiz ở trạng thái PRIVATE, chỉ có người tạo (creator) mới được phép xem.
     * - Nếu Quiz ở trạng thái PUBLIC_LINK hoặc MARKETPLACE, mọi người dùng đăng nhập đều có thể xem.
     * 
     * @param id ID của Quiz cần truy vấn
     * @return DTO thông tin chi tiết của Quiz
     * @throws AppException lỗi QUIZ_NOT_FOUND nếu không tìm thấy quiz,
     *                      QUIZ_ACCESS_DENIED nếu cố truy cập quiz private của người khác.
     */
    @Transactional(readOnly = true)
    public QuizResponse getQuizById(Long id) {
        Long currentUserId = userService.getCurrentUserId();
        Quiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Quyền xem: Chủ sở hữu HOẶC visibility khác PRIVATE
        if (!quiz.getCreator().getId().equals(currentUserId) && quiz.getVisibility() == Visibility.PRIVATE) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        return toQuizResponse(quiz);
    }

    /**
     * Cập nhật thông tin (metadata) của một Quiz hiện tại.
     * <p>
     * Kiểm tra quyền sở hữu nghiêm ngặt: chỉ người tạo Quiz mới được quyền cập nhật.
     * Hỗ trợ cập nhật đổi Notebook hoặc Subject khác (kèm validate quyền sở hữu và sự tồn tại).
     * 
     * @param id ID của Quiz cần cập nhật
     * @param request dữ liệu cập nhật mới
     * @return DTO thông tin Quiz sau khi lưu thay đổi
     * @throws AppException lỗi QUIZ_NOT_FOUND nếu không tìm thấy quiz,
     *                      QUIZ_ACCESS_DENIED nếu user không phải là người tạo.
     */
    @Transactional
    public QuizResponse updateQuiz(Long id, QuizRequest request) {
        Long currentUserId = userService.getCurrentUserId();
        Quiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Chỉ creator mới có quyền cập nhật
        if (!quiz.getCreator().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        Notebook notebook = null;
        if (request.getNotebookId() != null) {
            notebook = notebookRepository.findById(request.getNotebookId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
            // Validate notebook ownership
            if (!notebook.getUser().getId().equals(currentUserId)) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        Semester academicTerm = null;
        if (request.getAcademicTermId() != null) {
            academicTerm = semesterRepository.findById(request.getAcademicTermId())
                .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND));
        }

        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(request.getDescription());
        quiz.setNotebook(notebook);
        quiz.setSubject(subject);
        quiz.setAcademicTerm(academicTerm);
        quiz.setExamType(request.getExamType());
        if (request.getVisibility() != null) {
            quiz.setVisibility(request.getVisibility());
        }

        quiz = quizRepository.save(quiz);
        log.info("Quiz id={} updated by userId={}", quiz.getId(), currentUserId);
        return toQuizResponse(quiz);
    }

    /**
     * Xóa hoàn toàn một Quiz khỏi hệ thống.
     * <p>
     * Kiểm tra quyền sở hữu nghiêm ngặt: chỉ người tạo Quiz mới được quyền xóa.
     * 
     * @param id ID của Quiz cần xóa
     * @throws AppException lỗi QUIZ_NOT_FOUND nếu không tìm thấy quiz,
     *                      QUIZ_ACCESS_DENIED nếu user không phải là người tạo.
     */
    @Transactional
    public void deleteQuiz(Long id) {
        Long currentUserId = userService.getCurrentUserId();
        Quiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Chỉ creator mới có quyền xóa
        if (!quiz.getCreator().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }

        quizRepository.delete(quiz);
        log.info("Quiz id={} deleted by userId={}", id, currentUserId);
    }

    /**
     * Tìm kiếm và lọc danh sách Quiz cá nhân (do chính người dùng đăng nhập tạo ra).
     * 
     * @param searchRequest bộ lọc tìm kiếm và phân loại Quiz
     * @param pageable cấu hình phân trang và sắp xếp
     * @return danh sách Quiz dạng phân trang (Page DTO)
     */
    @Transactional(readOnly = true)
    public Page<QuizResponse> searchMyQuizzes(QuizSearchRequest searchRequest, Pageable pageable) {
        Long currentUserId = userService.getCurrentUserId();
        String keyword = searchRequest.getKeyword() != null ? searchRequest.getKeyword().trim() : null;
        return quizRepository.searchMyQuizzes(
            currentUserId,
            keyword,
            searchRequest.getSubjectId(),
            searchRequest.getNotebookId(),
            searchRequest.getAcademicTermId(),
            searchRequest.getExamType(),
            searchRequest.getVisibility(),
            searchRequest.getMarketStatus(),
            pageable
        ).map(this::toQuizResponse);
    }

    // ── Mapping Helper ───────────────────────────────────────────────────────
    private QuizResponse toQuizResponse(Quiz quiz) {
        return QuizResponse.builder()
            .id(quiz.getId())
            .notebookId(quiz.getNotebook() != null ? quiz.getNotebook().getId() : null)
            .notebookTitle(quiz.getNotebook() != null ? quiz.getNotebook().getTitle() : null)
            .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
            .subjectName(quiz.getSubject() != null ? quiz.getSubject().getName() : null)
            .creatorId(quiz.getCreator().getId())
            .creatorFullName(quiz.getCreator().getFullName())
            .title(quiz.getTitle())
            .description(quiz.getDescription())
            .academicTermId(quiz.getAcademicTerm() != null ? quiz.getAcademicTerm().getId() : null)
            .academicTermName(quiz.getAcademicTerm() != null ? quiz.getAcademicTerm().getName() : null)
            .examType(quiz.getExamType())
            .visibility(quiz.getVisibility())
            .marketStatus(quiz.getMarketStatus())
            .downloadCount(quiz.getDownloadCount())
            .reviewCount(quiz.getReviewCount())
            .acceptPercentage(quiz.getAcceptPercentage())
            .aiVerdictNote(quiz.getAiVerdictNote())
            .createdAt(quiz.getCreatedAt())
            .updatedAt(quiz.getUpdatedAt())
            .build();
    }
}
