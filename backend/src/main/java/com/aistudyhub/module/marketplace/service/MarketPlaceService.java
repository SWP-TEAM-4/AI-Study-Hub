package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.repository.QuizRepository;

import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.document.service.DocumentSafetyGuard;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponseMapper;
import com.aistudyhub.module.marketplace.dto.MarketplaceItemResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceItemResponseMapper;
import com.aistudyhub.module.marketplace.dto.MarketplaceQueryRequest;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizResponseMapper;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý các nghiệp vụ liên quan đến Marketplace (Chợ tài liệu).
 * Owner: BE3 (Task BE-027)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MarketPlaceService {
    private final QuizRepository quizRepository;
    private final UserService userService;
    private final DocumentRepository documentRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ActivityLogService activityLogService;
    private final MarketplaceSubmissionService marketplaceSubmissionService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final DocumentSafetyGuard documentSafetyGuard;

    /**
     * Gửi yêu cầu đăng tải một tài liệu học tập (Document) lên Marketplace.
     * 
     * @param documentId ID của tài liệu cần đăng tải
     * @param note       Ghi chú đăng tải từ người dùng
     * @return DocumentResponse chứa thông tin tài liệu đã cập nhật trạng thái xuất
     *         bản
     */
    @Transactional
    public DocumentResponse submitDocument(Long documentId, String note) {
        // Bước 1: Lấy ID người dùng đăng nhập hiện tại từ bộ nhớ
        Long currentUserId = userService.getCurrentUserId();
        // Bước 2: Tìm tài liệu. Sử dụng mã lỗi DOCUMENT_NOT_FOUND
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        // Bước 3: Xác thực quyền sở hữu. Sử dụng mã lỗi DOCUMENT_ACCESS_DENIED
        if (!document.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
        }
        // Bước 3b: Kiểm tra nếu là tài liệu nhân bản thì không được đăng tải lại
        if (document.getClonedFrom() != null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Cannot publish a cloned document back to the marketplace.");
        }
        // Bước 4: Kiểm tra metadata cơ bản
        if (document.getSubject() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Subject is required to publish this document to the marketplace.");
        }
        if (document.getTitle() == null || document.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Title cannot be empty.");
        }
        if (document.getDescription() == null || document.getDescription().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Description cannot be empty.");
        }
        // Bước 5: Kiểm tra sự tồn tại của tệp tin vật lý
        if (document.getFileUrl() == null || document.getFileUrl().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Document file is missing.");
        }
        // Bước 6: Kiểm tra trạng thái xử lý AI phải thành công
        if (document.getProcessingStatus() != ProcessingStatus.SUCCESS) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Document processing is not successful yet.");
        }
        documentSafetyGuard.assertDistributable(document);
        assertCanSubmit(document.getMarketStatus());
        marketplaceSubmissionService.create("DOCUMENT", document.getId(), document.getSubject(), document.getUser(), note);
        // Bước 7: Cập nhật Visibility, MarketStatus và SubmitNote
        document.setVisibility(Visibility.MARKETPLACE);
        document.setMarketStatus(MarketStatus.PENDING);
        document.setSubmitNote(note);
        // Bước 8: Lưu thực thể đã cập nhật vào DB
        Document savedDoc = documentRepository.save(document);
        notifySubmission(savedDoc.getUser().getId(), savedDoc.getTitle());
        log.info("Document id={} has been submitted to the marketplace by userId={}", documentId, currentUserId);
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("marketStatus", savedDoc.getMarketStatus().name());
        metadata.put("visibility", savedDoc.getVisibility().name());
        metadata.put("subjectId", savedDoc.getSubject() != null ? savedDoc.getSubject().getId() : null);
        metadata.put("noteProvided", note != null && !note.trim().isEmpty());
        activityLogService.log(
                currentUserId,
                ActivityActionType.PUBLISH_MARKETPLACE,
                ActivityTargetType.DOCUMENT,
                savedDoc.getId(),
                metadata,
                savedDoc.getTitle(),
                savedDoc.getSubject() != null ? savedDoc.getSubject().getCode() : null);
        // Bước 9: Trả về DTO thông qua Mapper
        return DocumentResponseMapper.toResponse(savedDoc);
    }

    private void notifySubmission(Long authorId, String title) {
        notificationService.createNotification(authorId, "Đã gửi đơn kiểm duyệt",
                "Nội dung \"" + title + "\" đã được gửi và đang chờ kiểm duyệt.");
        userRepository.findAllByRoleAndIsActiveTrue(Role.ADMIN).forEach(admin ->
                notificationService.createNotification(admin.getId(), "Có đơn kiểm duyệt mới",
                        "Nội dung \"" + title + "\" đang chờ bạn kiểm duyệt."));
    }

    /**
     * Gửi yêu cầu đăng tải một đề thi (Quiz) lên Marketplace.
     * 
     * @param quizId ID của đề thi cần đăng tải
     * @param note   Ghi chú đăng tải từ người dùng
     * @return QuizResponse chứa thông tin đề thi đã cập nhật
     */
    @Transactional
    public QuizResponse submitQuiz(Long quizId, String note) {
        // Bước 1: Lấy ID người dùng đăng nhập hiện tại từ bộ nhớ
        Long currentUserId = userService.getCurrentUserId();
        // Bước 2: Tìm Quiz theo ID. Sử dụng mã lỗi QUIZ_NOT_FOUND
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Bước 3: Xác thực quyền sở hữu. Sử dụng mã lỗi QUIZ_ACCESS_DENIED
        if (!quiz.getCreator().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
        // Bước 3b: Kiểm tra nếu là đề thi nhân bản thì không được đăng tải lại
        if (quiz.getClonedFrom() != null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Cannot publish a cloned quiz back to the marketplace.");
        }
        // Bước 4: Kiểm tra metadata cơ bản
        if (quiz.getSubject() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Subject is required to publish this quiz to the marketplace.");
        }
        if (quiz.getTitle() == null || quiz.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Title cannot be empty.");
        }
        if (quiz.getDescription() == null || quiz.getDescription().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Description cannot be empty.");
        }
        // Bước 5: Kiểm tra bắt buộc có Loại kỳ thi (examType)
        if (quiz.getExamType() == null || quiz.getExamType().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Exam type cannot be empty.");
        }
        // Bước 6: Kiểm tra đề thi phải có ít nhất 1 câu hỏi con
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderById(quizId);
        if (questions == null || questions.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Quiz must contain at least one question.");
        }
        assertCanSubmit(quiz.getMarketStatus());
        marketplaceSubmissionService.create("QUIZ", quiz.getId(), quiz.getSubject(), quiz.getCreator(), note);
        // Bước 7: Cập nhật Visibility, MarketStatus và SubmitNote
        quiz.setVisibility(Visibility.MARKETPLACE);
        quiz.setMarketStatus(MarketStatus.PENDING);
        quiz.setSubmitNote(note);
        // Bước 8: Lưu thực thể và ghi log
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Quiz id={} has been submitted to the marketplace by userId={}", quizId, currentUserId);
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("marketStatus", savedQuiz.getMarketStatus().name());
        metadata.put("visibility", savedQuiz.getVisibility().name());
        metadata.put("subjectId", savedQuiz.getSubject() != null ? savedQuiz.getSubject().getId() : null);
        metadata.put("noteProvided", note != null && !note.trim().isEmpty());
        metadata.put("questionCount", questions.size());
        activityLogService.log(
                currentUserId,
                ActivityActionType.PUBLISH_MARKETPLACE,
                ActivityTargetType.QUIZ,
                savedQuiz.getId(),
                metadata,
                savedQuiz.getTitle(),
                savedQuiz.getSubject() != null ? savedQuiz.getSubject().getCode() : null);
        // Bước 9: Trả về DTO thông qua Mapper
        return QuizResponseMapper.toResponse(savedQuiz);
    }

    /**
     * Gửi yêu cầu đăng tải một bộ thẻ ghi nhớ (Flashcard Deck) lên Marketplace.
     * 
     * @param deckId ID của bộ thẻ cần đăng tải
     * @param note   Ghi chú đăng tải từ người dùng
     * @return FlashcardDeckResponse chứa thông tin bộ thẻ đã cập nhật
     */
    @Transactional
    public FlashcardDeckResponse submitFlashcardDeck(Long deckId, String note) {
        // Bước 1: Lấy ID người dùng đăng nhập hiện tại từ bộ nhớ
        Long currentUserId = userService.getCurrentUserId();
        // Bước 2: Tìm FlashcardDeck theo ID. Sử dụng mã lỗi FLASHCARD_DECK_NOT_FOUND
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        // Bước 3: Xác thực quyền sở hữu. Sử dụng mã lỗi FLASHCARD_DECK_ACCESS_DENIED
        if (!deck.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }

        // Bước 3b: Kiểm tra nếu là bộ thẻ ghi nhớ nhân bản thì không được đăng tải lại
        if (deck.getClonedFrom() != null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Cannot publish a cloned flashcard deck back to the marketplace.");
        }
        // Bước 4: Kiểm tra metadata
        if (deck.getSubject() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Subject is required to publish this flashcard deck to the marketplace.");
        }
        if (deck.getTitle() == null || deck.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Title cannot be empty.");
        }
        // Bước 5: Kiểm tra bộ Flashcard phải có ít nhất 1 thẻ nhớ con
        if (deck.getCards() == null || deck.getCards().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Flashcard deck must contain at least one card.");
        }
        assertCanSubmit(deck.getMarketStatus());
        marketplaceSubmissionService.create("FLASHCARD_DECK", deck.getId(), deck.getSubject(), deck.getUser(), note);
        // Bước 6: Cập nhật Visibility, MarketStatus và SubmitNote
        deck.setVisibility(Visibility.MARKETPLACE);
        deck.setMarketStatus(MarketStatus.PENDING);
        deck.setSubmitNote(note);
        // Bước 7: Lưu thực thể và ghi log
        FlashcardDeck savedDeck = flashcardDeckRepository.save(deck);
        log.info("FlashcardDeck id={} has been submitted to the marketplace by userId={}", deckId, currentUserId);
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("marketStatus", savedDeck.getMarketStatus().name());
        metadata.put("visibility", savedDeck.getVisibility().name());
        metadata.put("subjectId", savedDeck.getSubject() != null ? savedDeck.getSubject().getId() : null);
        metadata.put("noteProvided", note != null && !note.trim().isEmpty());
        metadata.put("cardCount", savedDeck.getCards() != null ? savedDeck.getCards().size() : 0);
        activityLogService.log(
                currentUserId,
                ActivityActionType.PUBLISH_MARKETPLACE,
                ActivityTargetType.FLASHCARD_DECK,
                savedDeck.getId(),
                metadata,
                savedDeck.getTitle(),
                savedDeck.getSubject() != null ? savedDeck.getSubject().getCode() : null);
        // Bước 8: Trả về DTO thông qua Mapper
        return FlashcardDeckResponseMapper.toResponse(savedDeck);
    }

    /**
     * Lấy danh sách tài liệu học tập (Documents) đã được duyệt và hiển thị trên
     * Marketplace.
     * 
     * @param request DTO chứa các tham số lọc và phân trang truyền lên từ Frontend
     * @return PaginationResponse chứa danh sách tài liệu đã ánh xạ sang
     *         MarketplaceItemResponse DTO
     */
    public PaginationResponse<MarketplaceItemResponse> getDocumentsInMarket(MarketplaceQueryRequest request) {
        // Bước 1: Validate và chuẩn hóa dữ liệu đầu vào (Phòng ngự lỗi phân trang)
        int page = (request.getPage() == null || request.getPage() < 0) ? 0 : request.getPage();
        int size = (request.getSize() == null || request.getSize() <= 0) ? 10 : request.getSize();

        String sort = request.getSort() != null ? request.getSort() : "newest";

        // Bước 2: Thiết lập sắp xếp dựa theo yêu cầu trích xuất từ DTO
        Sort springSort = "downloadCount".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.DESC, "downloadCount")
                : "acceptPercentage".equalsIgnoreCase(sort)
                        ? Sort.by(Sort.Direction.DESC, "acceptPercentage")
                        : Sort.by(Sort.Direction.DESC, "createdAt");

        Pageable pageable = PageRequest.of(page, size, springSort);

        // Bước 3: Tạo bộ lọc JPA Specification inline
        Specification<Document> spec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            // Chỉ lấy các tài nguyên hiển thị trên Chợ & đã được Duyệt
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            predicates.add(cb.equal(root.get("processingStatus"), ProcessingStatus.SUCCESS));
            predicates.add(cb.equal(root.get("moderationStatus"), DocumentModerationStatus.SAFE));

            // Lọc theo môn học (subjectId) nếu có truyền lên
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }

            // Tìm kiếm theo từ khóa (keyword) trong tiêu đề hoặc mô tả
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleLike, descLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        // Bước 4: Thực hiện truy vấn database phân trang qua Repository
        Page<Document> docPage = documentRepository.findAll(spec, pageable);

        // Bước 5: Ánh xạ danh sách Entity thu được sang DTO bằng Mapper
        List<MarketplaceItemResponse> items = docPage.getContent().stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());

        // Bước 6: Trả về đối tượng phân trang chuẩn
        return PaginationResponse.of(items, page, size, docPage.getTotalElements());
    }

    /**
     * Lấy danh sách đề thi (Quizzes) đã được duyệt và hiển thị trên Marketplace.
     * Hỗ trợ tìm kiếm từ khóa, lọc môn học, lọc học kỳ, lọc loại đề thi, sắp xếp và
     * phân trang.
     *
     * @param request DTO chứa các tham số lọc và phân trang từ Frontend gửi lên
     * @return PaginationResponse chứa danh sách Quiz đã ánh xạ sang
     *         MarketplaceItemResponse DTO
     */
    public PaginationResponse<MarketplaceItemResponse> getQuizzesInMarket(MarketplaceQueryRequest request) {
        // Bước 1: Validate dữ liệu đầu vào chống lỗi phân trang
        int page = (request.getPage() == null || request.getPage() < 0) ? 0 : request.getPage();
        int size = (request.getSize() == null || request.getSize() <= 0) ? 10 : request.getSize();
        String sort = request.getSort() != null ? request.getSort() : "newest";

        // Bước 2: Chuẩn bị thông tin sắp xếp
        Sort springSort = "downloadCount".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.DESC, "downloadCount")
                : "acceptPercentage".equalsIgnoreCase(sort)
                        ? Sort.by(Sort.Direction.DESC, "acceptPercentage")
                        : Sort.by(Sort.Direction.DESC, "createdAt");

        Pageable pageable = PageRequest.of(page, size, springSort);

        // Bước 3: Tạo bộ lọc JPA Specification inline cho Quiz
        Specification<Quiz> spec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            // Chỉ lấy Quiz ở chế độ MARKETPLACE và đã APPROVED
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            // Lọc theo môn học nếu có
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }
            // Lọc theo Học kỳ của đề thi (chỉ áp dụng cho Quiz)
            if (request.getAcademicTermId() != null) {
                predicates.add(cb.equal(root.get("academicTerm").get("id"), request.getAcademicTermId()));
            }
            // Lọc theo loại đề thi (ví dụ: Midterm, Final,...)
            if (request.getExamType() != null && !request.getExamType().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("examType"), request.getExamType().trim()));
            }
            // Tìm kiếm keyword trong tiêu đề hoặc mô tả của đề thi
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleLike, descLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Bước 4: Truy vấn phân trang từ Database
        Page<Quiz> quizPage = quizRepository.findAll(spec, pageable);

        // Bước 5: Ánh xạ danh sách Entity sang DTO
        List<MarketplaceItemResponse> items = quizPage.getContent().stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());

        // Bước 6: Đóng gói kết quả phân trang
        return PaginationResponse.of(items, page, size, quizPage.getTotalElements());
    }

    /**
     * Lấy danh sách bộ thẻ ghi nhớ (Flashcard Decks) đã được duyệt và hiển thị trên
     * Marketplace.
     * Hỗ trợ tìm kiếm từ khóa theo tiêu đề, lọc theo môn học, sắp xếp và phân
     * trang.
     *
     * @param request DTO chứa các tham số lọc và phân trang từ Frontend gửi lên
     * @return PaginationResponse chứa danh sách FlashcardDeck đã ánh xạ sang DTO
     *         tương ứng
     */
    public PaginationResponse<MarketplaceItemResponse> getFlashcardDecksInMarket(MarketplaceQueryRequest request) {
        // Bước 1: Validate dữ liệu đầu vào chống lỗi phân trang
        int page = (request.getPage() == null || request.getPage() < 0) ? 0 : request.getPage();
        int size = (request.getSize() == null || request.getSize() <= 0) ? 10 : request.getSize();
        String sort = request.getSort() != null ? request.getSort() : "newest";

        // Bước 2: Thiết lập sắp xếp dựa theo yêu cầu trích xuất từ DTO
        Sort springSort = "downloadCount".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.DESC, "downloadCount")
                : "acceptPercentage".equalsIgnoreCase(sort)
                        ? Sort.by(Sort.Direction.DESC, "acceptPercentage")
                        : Sort.by(Sort.Direction.DESC, "createdAt");

        Pageable pageable = PageRequest.of(page, size, springSort);

        // Bước 3: Tạo bộ lọc JPA Specification inline cho FlashcardDeck
        Specification<FlashcardDeck> spec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();

            // Chỉ lấy Flashcard Deck hiển thị trên Chợ và đã được Duyệt
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));

            // Lọc theo môn học nếu có
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }

            // Tìm kiếm keyword theo tiêu đề bộ thẻ (Deck không có trường description)
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Bước 4: Truy vấn phân trang từ Database
        Page<FlashcardDeck> deckPage = flashcardDeckRepository.findAll(spec, pageable);

        // Bước 5: Ánh xạ danh sách Entity thu được sang DTO
        List<MarketplaceItemResponse> items = deckPage.getContent().stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());

        // Bước 6: Đóng gói kết quả phân trang trả về
        return PaginationResponse.of(items, page, size, deckPage.getTotalElements());
    }

    /**
     * Tìm kiếm tổng hợp (Search) gộp cả 3 loại tài nguyên học tập trên chợ.
     * Trộn kết quả từ 3 bảng, sắp xếp toàn cục trong bộ nhớ và thực hiện phân trang
     * thủ công.
     *
     * @param request DTO chứa các tham số lọc và phân trang từ Frontend gửi lên
     * @return PaginationResponse chứa danh sách DTO MarketplaceItemResponse kết hợp
     *         đã phân trang
     */
    public PaginationResponse<MarketplaceItemResponse> searchMarketplace(MarketplaceQueryRequest request) {
        // Bước 1: Validate dữ liệu đầu vào chống lỗi phân trang
        int page = (request.getPage() == null || request.getPage() < 0) ? 0 : request.getPage();
        int size = (request.getSize() == null || request.getSize() <= 0) ? 10 : request.getSize();
        String sort = request.getSort() != null ? request.getSort() : "newest";

        // 1. Tìm toàn bộ Document thỏa mãn điều kiện và ánh xạ sang Marketplace DTO
        Specification<Document> docSpec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            predicates.add(cb.equal(root.get("processingStatus"), ProcessingStatus.SUCCESS));
            predicates.add(cb.equal(root.get("moderationStatus"), DocumentModerationStatus.SAFE));
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<MarketplaceItemResponse> docs = documentRepository.findAll(docSpec).stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());

        // 2. Tìm toàn bộ Quiz thỏa mãn điều kiện và ánh xạ sang Marketplace DTO
        Specification<Quiz> quizSpec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<MarketplaceItemResponse> quizzes = quizRepository.findAll(quizSpec).stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());
        // 3. Tìm toàn bộ FlashcardDeck thỏa mãn điều kiện và ánh xạ sang Marketplace
        // DTO
        Specification<FlashcardDeck> deckSpec = (root, query, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("visibility"), Visibility.MARKETPLACE));
            predicates.add(cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            if (request.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), request.getSubjectId()));
            }
            if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                String pattern = "%" + request.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<MarketplaceItemResponse> decks = flashcardDeckRepository.findAll(deckSpec).stream()
                .map(MarketplaceItemResponseMapper::toResponse)
                .collect(Collectors.toList());
        // 4. Gộp toàn bộ danh sách kết quả của cả 3 loại tài nguyên vào một danh sách
        // duy nhất
        List<MarketplaceItemResponse> combined = new ArrayList<>();
        combined.addAll(docs);
        combined.addAll(quizzes);
        combined.addAll(decks);
        // 5. Sắp xếp danh sách gộp trong bộ nhớ dựa theo tiêu chí yêu cầu
        if ("downloadCount".equalsIgnoreCase(sort)) {
            combined.sort((a, b) -> b.getDownloadCount().compareTo(a.getDownloadCount()));
        } else if ("acceptPercentage".equalsIgnoreCase(sort)) {
            combined.sort((a, b) -> b.getAcceptPercentage().compareTo(a.getAcceptPercentage()));
        } else {
            // Mặc định: Sắp xếp theo ngày tạo mới nhất (newest)
            combined.sort((a, b) -> {
                LocalDateTime ta = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                LocalDateTime tb = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                return tb.compareTo(ta);
            });
        }

        // 6. Phân trang thủ công (in-memory slicing)
        int totalElements = combined.size();
        int start = page * size;
        List<MarketplaceItemResponse> pageItems = new ArrayList<>();
        if (start < totalElements) {
            int end = Math.min(start + size, totalElements);
            pageItems = combined.subList(start, end);
        }

        // 7. Đóng gói kết quả phân trang trả về cho client
        return PaginationResponse.of(pageItems, page, size, totalElements);
    }

    private void assertCanSubmit(MarketStatus status) {
        if (status == MarketStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Content is already pending review");
        }
        if (status == MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Approved content cannot be submitted again");
        }
    }
}
