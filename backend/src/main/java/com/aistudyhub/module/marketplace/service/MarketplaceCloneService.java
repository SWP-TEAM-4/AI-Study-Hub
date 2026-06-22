package com.aistudyhub.module.marketplace.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizResponseMapper;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponseMapper;
import com.aistudyhub.module.marketplace.dto.MarketplaceCloneRequest;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý các nghiệp vụ liên quan đến nhân bản (Clone) tài nguyên từ Marketplace
 * về không gian cá nhân của học viên.
 * Trực thuộc Task: BE-029
 */
@RequiredArgsConstructor
@Slf4j
@Service
public class MarketplaceCloneService {

    private final UserService userService;
    private final DocumentRepository documentRepository;
    private final NotebookDocumentRepository notebookDocumentRepository;
    private final NotebookRepository notebookRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;

    /**
     * Nhân bản một tài liệu học tập (Document) từ Marketplace về kho cá nhân.
     * Tăng lượt tải của tài liệu gốc và tự động liên kết vào Notebook đích nếu được yêu cầu.
     * Lưu vết nguồn gốc tài liệu thông qua thuộc tính clonedFrom.
     *
     * @param documentId ID của tài liệu gốc trên chợ cần nhân bản
     * @param request    DTO chứa thông tin Notebook đích (tùy chọn)
     * @return DocumentResponse chứa thông tin tài liệu bản sao mới
     */
    @Transactional
    public DocumentResponse cloneDocumentInMarket(Long documentId, MarketplaceCloneRequest request) {
        // 1. Lấy thông tin User hiện tại đang đăng nhập từ Security Context
        User currentUser = userService.getCurrentUser();

        // 2. Tìm kiếm tài liệu gốc trong database
        Document originalDoc = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        // 3. Kiểm tra bảo mật: Tài liệu phải ở chế độ MARKETPLACE và trạng thái APPROVED (Đã duyệt)
        if (originalDoc.getVisibility() != Visibility.MARKETPLACE
                || originalDoc.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }

        // 4. Tạo đối tượng Document bản sao, copy toàn bộ nội dung từ bản gốc
        Document clonedDoc = Document.builder()
                .user(currentUser) // Người sở hữu mới là người dùng hiện tại
                .subject(originalDoc.getSubject())
                .title(originalDoc.getTitle())
                .description(originalDoc.getDescription())
                .fileUrl(originalDoc.getFileUrl())
                .cloudFilePath(originalDoc.getCloudFilePath())
                .fileType(originalDoc.getFileType())
                .fileSize(originalDoc.getFileSize())
                .visibility(Visibility.PRIVATE) // Bản sao cá nhân luôn mặc định là PRIVATE
                .marketStatus(MarketStatus.NONE) // Bản sao không liên kết trên Chợ nữa
                .processingStatus(ProcessingStatus.SUCCESS)
                .clonedFrom(originalDoc) // Lưu vết nguồn gốc tài liệu gốc
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();
        // Lưu tài liệu bản sao vào database
        Document savedDoc = documentRepository.save(clonedDoc);

        // 5. Nếu Frontend gửi lên targetNotebookId, thực hiện gắn tài liệu vào Notebook tương ứng
        if (request != null && request.getTargetNotebookId() != null) {
            Notebook notebook = notebookRepository.findById(request.getTargetNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));

            // Phòng ngự lỗi: Chỉ cho phép gắn tài liệu vào Notebook do chính mình sở hữu
            if (!notebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }

            // Tạo bản ghi liên kết trung gian giữa Notebook và Document
            NotebookDocument notebookDoc = NotebookDocument.builder()
                    .notebook(notebook)
                    .document(savedDoc)
                    .build();
            notebookDocumentRepository.save(notebookDoc);
        }

        // 6. Tăng downloadCount của tài liệu gốc trên chợ lên 1 đơn vị và lưu lại
        originalDoc.setDownloadCount(originalDoc.getDownloadCount() + 1);
        documentRepository.save(originalDoc);

        log.info("User id={} successfully cloned Document id={} to cloned Document id={}",
                currentUser.getId(), documentId, savedDoc.getId());

        // Trả về DTO thông qua Mapper chuẩn của Document
        return DocumentResponseMapper.toResponse(savedDoc);
    }

    /**
     * Nhân bản một đề thi (Quiz) từ Marketplace về Notebook cá nhân của học viên.
     * Sao chép sâu (Deep Copy) toàn bộ câu hỏi (QuizQuestion) và các đáp án (QuizOption).
     * Tăng số lượt tải của đề thi gốc lên 1 đơn vị.
     * Lưu vết nguồn gốc đề thi thông qua thuộc tính clonedFrom.
     *
     * @param quizId  ID của đề thi gốc trên chợ cần nhân bản
     * @param request DTO chứa thông tin Notebook đích (tùy chọn)
     * @return QuizResponse chứa thông tin đề thi bản sao mới
     */
    @Transactional
    public QuizResponse cloneQuizInMarket(Long quizId, MarketplaceCloneRequest request) {
        // 1. Lấy thông tin User hiện tại đang đăng nhập
        User currentUser = userService.getCurrentUser();

        // 2. Tìm kiếm Quiz gốc trong database
        Quiz originalQuiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // 3. Kiểm tra bảo mật: Quiz phải ở chế độ MARKETPLACE và trạng thái APPROVED (Đã duyệt)
        if (originalQuiz.getVisibility() != Visibility.MARKETPLACE
                || originalQuiz.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }

        // 4. Kiểm tra Notebook đích nếu người dùng yêu cầu liên kết trực tiếp vào Notebook
        Notebook targetNotebook = null;
        if (request != null && request.getTargetNotebookId() != null) {
            targetNotebook = notebookRepository.findById(request.getTargetNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));

            // Phòng ngự lỗi: Chỉ cho phép gắn Quiz vào Notebook do chính mình sở hữu
            if (!targetNotebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        // 5. Tạo đối tượng Quiz bản sao (Gán creator = currentUser, set notebook đích trực tiếp)
        Quiz clonedQuiz = Quiz.builder()
                .creator(currentUser)
                .notebook(targetNotebook)
                .subject(originalQuiz.getSubject())
                .title(originalQuiz.getTitle())
                .description(originalQuiz.getDescription())
                .academicTerm(originalQuiz.getAcademicTerm())
                .examType(originalQuiz.getExamType())
                .visibility(Visibility.PRIVATE) // Bản sao cá nhân luôn mặc định là PRIVATE
                .marketStatus(MarketStatus.NONE) // Bản sao không liên kết trên Chợ nữa
                .clonedFrom(originalQuiz) // Lưu vết nguồn gốc đề thi gốc
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();
        // Lưu Quiz bản sao vào database
        Quiz savedQuiz = quizRepository.save(clonedQuiz);

        // 6. Thực hiện nhân bản sâu (Deep Copy) toàn bộ câu hỏi và đáp án con
        List<QuizQuestion> originalQuestions = quizQuestionRepository.findByQuizIdOrderById(quizId);
        List<QuizQuestion> clonedQuestions = new ArrayList<>();

        for (QuizQuestion origQ : originalQuestions) {
            QuizQuestion clonedQ = QuizQuestion.builder()
                    .quiz(savedQuiz) // Gắn câu hỏi mới vào Quiz vừa tạo ở bước trên
                    .questionText(origQ.getQuestionText())
                    .questionType(origQ.getQuestionType())
                    .explanation(origQ.getExplanation())
                    .build();

            // Clone danh sách đáp án tương ứng của câu hỏi đó
            List<QuizOption> clonedOptions = new ArrayList<>();
            for (QuizOption origOpt : origQ.getOptions()) {
                QuizOption clonedOpt = QuizOption.builder()
                        .question(clonedQ) // Gắn đáp án mới vào câu hỏi mới tương ứng
                        .optionText(origOpt.getOptionText())
                        .isCorrect(origOpt.getIsCorrect())
                        .build();
                clonedOptions.add(clonedOpt);
            }
            clonedQ.setOptions(clonedOptions); // Gán list options đã clone vào câu hỏi mới
            clonedQuestions.add(clonedQ);
        }

        // Lưu toàn bộ câu hỏi và đáp án mới vào database
        quizQuestionRepository.saveAll(clonedQuestions);

        // 7. Tăng downloadCount của Quiz gốc trên chợ lên 1 đơn vị và lưu lại
        originalQuiz.setDownloadCount(originalQuiz.getDownloadCount() + 1);
        quizRepository.save(originalQuiz);

        log.info("User id={} successfully cloned Quiz id={} to cloned Quiz id={}",
                currentUser.getId(), quizId, savedQuiz.getId());

        // Trả về DTO thông qua Mapper của Quiz
        return QuizResponseMapper.toResponse(savedQuiz);
    }

    /**
     * Nhân bản một bộ thẻ ghi nhớ (FlashcardDeck) từ Marketplace về Notebook cá nhân của học viên.
     * Sao chép sâu (Deep Copy) toàn bộ thẻ ghi nhớ (Flashcard) con.
     * Tăng số lượt tải của bộ thẻ gốc lên 1 đơn vị.
     * Lưu vết nguồn gốc bộ thẻ thông qua thuộc tính clonedFrom.
     *
     * @param deckId  ID của bộ thẻ ghi nhớ gốc trên chợ cần nhân bản
     * @param request DTO chứa thông tin Notebook đích (tùy chọn)
     * @return FlashcardDeckResponse chứa thông tin bộ thẻ bản sao mới
     */
    @Transactional
    public FlashcardDeckResponse cloneFlashcardDeckInMarket(Long deckId, MarketplaceCloneRequest request) {
        // 1. Lấy thông tin User hiện tại đang đăng nhập
        User currentUser = userService.getCurrentUser();

        // 2. Tìm kiếm FlashcardDeck gốc trong database
        FlashcardDeck originalDeck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        // 3. Kiểm tra bảo mật: Bộ thẻ phải ở chế độ MARKETPLACE và trạng thái APPROVED (Đã duyệt)
        if (originalDeck.getVisibility() != Visibility.MARKETPLACE
                || originalDeck.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }

        // 4. Kiểm tra Notebook đích nếu người dùng yêu cầu liên kết
        Notebook targetNotebook = null;
        if (request != null && request.getTargetNotebookId() != null) {
            targetNotebook = notebookRepository.findById(request.getTargetNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));

            // Phòng ngự lỗi: Chỉ cho phép gắn bộ thẻ vào Notebook do chính mình sở hữu
            if (!targetNotebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        // 5. Tạo đối tượng FlashcardDeck bản sao (Gán user = currentUser, set notebook đích trực tiếp)
        FlashcardDeck clonedDeck = FlashcardDeck.builder()
                .user(currentUser)
                .notebook(targetNotebook)
                .subject(originalDeck.getSubject())
                .title(originalDeck.getTitle())
                .visibility(Visibility.PRIVATE) // Bản sao cá nhân luôn mặc định là PRIVATE
                .marketStatus(MarketStatus.NONE) // Bản sao không liên kết trên Chợ nữa
                .clonedFrom(originalDeck) // Lưu vết nguồn gốc bộ thẻ gốc
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();

        // 6. Thực hiện nhân bản sâu (Deep Copy) danh sách các thẻ ghi nhớ (Flashcard) con
        List<Flashcard> clonedCards = new ArrayList<>();
        if (originalDeck.getCards() != null) {
            for (Flashcard origCard : originalDeck.getCards()) {
                Flashcard clonedCard = Flashcard.builder()
                        .deck(clonedDeck) // Gắn thẻ mới vào bộ bài mới clone
                        .frontText(origCard.getFrontText())
                        .backText(origCard.getBackText())
                        .build();
                clonedCards.add(clonedCard);
            }
        }
        clonedDeck.setCards(clonedCards); // Gán danh sách thẻ mới đã clone vào thực thể Deck mới

        // Nhờ thiết lập cascade = CascadeType.ALL trên trường cards của FlashcardDeck entity,
        // việc lưu clonedDeck sẽ tự động thực hiện lưu toàn bộ các Flashcard con ở database.
        FlashcardDeck savedDeck = flashcardDeckRepository.save(clonedDeck);

        // 7. Tăng downloadCount của FlashcardDeck gốc trên chợ lên 1 đơn vị và lưu lại
        originalDeck.setDownloadCount(originalDeck.getDownloadCount() + 1);
        flashcardDeckRepository.save(originalDeck);

        log.info("User id={} successfully cloned FlashcardDeck id={} to cloned Deck id={}",
                currentUser.getId(), deckId, savedDeck.getId());

        // Trả về DTO thông qua Mapper của FlashcardDeck
        return FlashcardDeckResponseMapper.toResponse(savedDeck);
    }
}
