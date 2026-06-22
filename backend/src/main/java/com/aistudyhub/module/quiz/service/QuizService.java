package com.aistudyhub.module.quiz.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.quiz.dto.QuizRequest;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizResponseMapper;
import com.aistudyhub.module.quiz.dto.QuizSearchRequest;
import com.aistudyhub.module.quiz.dto.GenerateQuizRequest;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    private final DocumentRepository documentRepository;
    private final NotebookDocumentRepository notebookDocumentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final QuizQuestionRepository quizQuestionRepository;

    /**
     * Tạo một Quiz mới thuộc về người dùng hiện tại đăng nhập.
     * <p>
     * Hàm này thực hiện các bước validation quan trọng:
     * 1. Xác thực sự tồn tại của Notebook và kiểm tra xem người dùng có sở hữu
     * Notebook đó không.
     * 2. Xác thực sự tồn tại của môn học (Subject) và kỳ học (Semester).
     * 
     * @param request dữ liệu cấu hình Quiz từ client
     * @return DTO thông tin Quiz sau khi đã lưu vào database
     * @throws AppException lỗi NOTEBOOK_NOT_FOUND nếu không tìm thấy notebook,
     *                      NOTEBOOK_ACCESS_DENIED nếu notebook không thuộc sở hữu
     *                      của user đăng nhập,
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
        return QuizResponseMapper.toResponse(quiz);
    }

    /**
     * Lấy thông tin chi tiết của một Quiz theo ID.
     * <p>
     * Logic phân quyền truy cập:
     * - Nếu Quiz ở trạng thái PRIVATE, chỉ có người tạo (creator) mới được phép
     * xem.
     * - Nếu Quiz ở trạng thái PUBLIC_LINK hoặc MARKETPLACE, mọi người dùng đăng
     * nhập đều có thể xem.
     * 
     * @param id ID của Quiz cần truy vấn
     * @return DTO thông tin chi tiết của Quiz
     * @throws AppException lỗi QUIZ_NOT_FOUND nếu không tìm thấy quiz,
     *                      QUIZ_ACCESS_DENIED nếu cố truy cập quiz private của
     *                      người khác.
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

        return QuizResponseMapper.toResponse(quiz);
    }

    /**
     * Cập nhật thông tin (metadata) của một Quiz hiện tại.
     * <p>
     * Kiểm tra quyền sở hữu nghiêm ngặt: chỉ người tạo Quiz mới được quyền cập
     * nhật.
     * Hỗ trợ cập nhật đổi Notebook hoặc Subject khác (kèm validate quyền sở hữu và
     * sự tồn tại).
     * 
     * @param id      ID của Quiz cần cập nhật
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
        return QuizResponseMapper.toResponse(quiz);
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
     * Tìm kiếm và lọc danh sách Quiz cá nhân (do chính người dùng đăng nhập tạo
     * ra).
     * Dùng JPA Specification để tránh lỗi Hibernate 6 khi pass null vào JPQL
     * params.
     */
    @Transactional(readOnly = true)
    public Page<QuizResponse> searchMyQuizzes(QuizSearchRequest searchRequest, Pageable pageable) {
        Long currentUserId = userService.getCurrentUserId();
        String keyword = searchRequest.getKeyword() != null ? searchRequest.getKeyword().trim() : null;

        Specification<Quiz> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Bắt buộc: chỉ lấy quiz của user hiện tại
            predicates.add(cb.equal(root.get("creator").get("id"), currentUserId));

            // Tìm kiếm theo keyword (title hoặc description)
            if (keyword != null && !keyword.isEmpty()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.and(
                        cb.isNotNull(root.get("description")),
                        cb.like(cb.lower(root.get("description")), pattern));
                predicates.add(cb.or(titleMatch, descMatch));
            }

            // Lọc theo subjectId
            if (searchRequest.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), searchRequest.getSubjectId()));
            }

            // Lọc theo notebookId
            if (searchRequest.getNotebookId() != null) {
                predicates.add(cb.equal(root.get("notebook").get("id"), searchRequest.getNotebookId()));
            }

            // Lọc theo academicTermId
            if (searchRequest.getAcademicTermId() != null) {
                predicates.add(cb.equal(root.get("academicTerm").get("id"), searchRequest.getAcademicTermId()));
            }

            // Lọc theo examType (case-insensitive)
            if (searchRequest.getExamType() != null && !searchRequest.getExamType().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("examType")),
                        searchRequest.getExamType().trim().toLowerCase()));
            }

            // Lọc theo visibility enum
            if (searchRequest.getVisibility() != null) {
                predicates.add(cb.equal(root.get("visibility"), searchRequest.getVisibility()));
            }

            // Lọc theo marketStatus enum
            if (searchRequest.getMarketStatus() != null) {
                predicates.add(cb.equal(root.get("marketStatus"), searchRequest.getMarketStatus()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return quizRepository.findAll(spec, pageable).map(QuizResponseMapper::toResponse);
    }

    @Transactional
    public QuizResponse generateQuiz(GenerateQuizRequest request) {
        // 1. Validation check
        if (request.getNotebookId() == null && request.getDocumentId() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Either notebookId or documentId must be provided");
        }

        User currentUser = userService.getCurrentUser();
        Notebook notebook = null;
        Document document = null;
        Subject subject = null;

        // 2. Fetch and check ownership of source
        if (request.getDocumentId() != null) {
            document = documentRepository.findById(request.getDocumentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
            if (!document.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
            }
            subject = document.getSubject();
        } else {
            notebook = notebookRepository.findById(request.getNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
            if (!notebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
            subject = notebook.getSubject();
        }

        // 3. Collect chunks
        List<DocumentChunk> chunks = new ArrayList<>();
        if (document != null) {
            chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(document.getId());
        } else {
            List<NotebookDocument> notebookDocs = notebookDocumentRepository.findByNotebookId(notebook.getId());
            List<Long> documentIds = notebookDocs.stream().map(nd -> nd.getDocument().getId()).toList();
            if (!documentIds.isEmpty()) {
                chunks = documentChunkRepository.findByDocumentIdInOrderByDocumentIdAscChunkIndexAsc(documentIds);
            }
        }

        // 4. Generate title and description for Quiz
        String sourceTitle = (document != null) ? document.getTitle() : notebook.getTitle();
        String quizTitle = sourceTitle + " - Mock Quiz";
        String quizDesc = "Đề thi trắc nghiệm ôn tập sinh tự động từ tài liệu: " + sourceTitle;

        Quiz quiz = Quiz.builder()
                .title(quizTitle)
                .description(quizDesc)
                .notebook(notebook)
                .subject(subject)
                .creator(currentUser)
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();

        quiz = quizRepository.save(quiz);

        int totalQuestions = request.getNumberOfQuestions();
        QuestionType targetType = request.getQuestionType() != null ? request.getQuestionType()
                : QuestionType.SINGLE_CHOICE;

        List<QuizQuestion> questions = new ArrayList<>();

        for (int i = 0; i < totalQuestions; i++) {
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setQuestionType(targetType);

            String textContent = null;
            String docTitle = sourceTitle;
            if (!chunks.isEmpty()) {
                DocumentChunk chunk = chunks.get(i % chunks.size());
                textContent = chunk.getTextContent();
                docTitle = chunk.getDocument().getTitle();
            }

            // Build question text
            String qText;
            if (textContent != null) {
                String cleanText = textContent.trim();
                if (cleanText.length() > 100) {
                    cleanText = cleanText.substring(0, 100) + "...";
                }
                qText = String.format("Dựa vào nội dung tài liệu '%s': \"%s\". Hãy trả lời câu hỏi sau đây:", docTitle,
                        cleanText);
            } else {
                qText = String.format("Câu hỏi ôn tập số %d cho tài liệu '%s':", i + 1, docTitle);
            }

            // Build specific mock details based on type
            List<QuizOption> options = new ArrayList<>();
            if (targetType == QuestionType.SINGLE_CHOICE) {
                question.setQuestionText(qText + " Đâu là nhận định chính xác nhất?");
                question.setExplanation(
                        "Giải thích: Nhận định chính xác nhất đã được rút ra trực tiếp từ tài liệu gốc.");

                options.add(QuizOption.builder().question(question).optionText("Lựa chọn đúng (Rút ra từ tài liệu)")
                        .isCorrect(true).build());
                options.add(QuizOption.builder().question(question)
                        .optionText("Lựa chọn nhiễu A (Thông tin không chính xác)").isCorrect(false).build());
                options.add(QuizOption.builder().question(question).optionText("Lựa chọn nhiễu B (Thông tin sai lệch)")
                        .isCorrect(false).build());
                options.add(QuizOption.builder().question(question).optionText("Lựa chọn nhiễu C (Không được nhắc đến)")
                        .isCorrect(false).build());
            } else if (targetType == QuestionType.MULTIPLE_CHOICE) {
                question.setQuestionText(qText + " Lựa chọn tất cả các đáp án đúng.");
                question.setExplanation(
                        "Giải thích: Các đáp án đúng phản ánh chính xác các thông tin có trong tài liệu học tập.");

                options.add(QuizOption.builder().question(question).optionText("Đáp án đúng thứ nhất").isCorrect(true)
                        .build());
                options.add(QuizOption.builder().question(question).optionText("Đáp án đúng thứ hai").isCorrect(true)
                        .build());
                options.add(QuizOption.builder().question(question).optionText("Đáp án đúng thứ ba").isCorrect(true)
                        .build());
                options.add(QuizOption.builder().question(question).optionText("Lựa chọn sai lệch").isCorrect(false)
                        .build());
            } else if (targetType == QuestionType.FILL_IN_THE_BLANK) {
                question.setQuestionText(qText
                        + " Điền từ khóa thích hợp vào chỗ trống: 'Hệ thống AI Study Hub hỗ trợ việc tự động học tập qua ______'.");
                question.setExplanation("Giải thích: Từ khóa cần điền chính xác là 'Quiz'.");

                // Đối với FILL_IN_THE_BLANK, ta lưu 1 option chứa từ khóa đúng (isCorrect =
                // true)
                options.add(QuizOption.builder().question(question).optionText("Quiz").isCorrect(true).build());
            }

            question.setOptions(options);
            questions.add(question);
        }

        // Save questions and options (cascade save)
        quizQuestionRepository.saveAll(questions);

        log.info("Quiz generated successfully with id={} ({} questions) by userId={}", quiz.getId(), totalQuestions,
                currentUser.getId());

        return QuizResponseMapper.toResponse(quiz);
    }
}
