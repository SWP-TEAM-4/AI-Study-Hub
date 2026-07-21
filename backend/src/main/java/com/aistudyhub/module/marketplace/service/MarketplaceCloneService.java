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
import com.aistudyhub.module.marketplace.entity.MarketplaceCloneReceipt;
import com.aistudyhub.module.marketplace.model.MarketplaceCloneTargetType;
import com.aistudyhub.module.marketplace.repository.MarketplaceCloneLockRepository;
import com.aistudyhub.module.marketplace.repository.MarketplaceCloneReceiptRepository;
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
    private final MarketplaceCloneReceiptRepository cloneReceiptRepository;
    private final MarketplaceCloneLockRepository cloneLockRepository;

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
        User currentUser = userService.getCurrentUser();
        Document originalDoc = cloneLockRepository.findDocumentByIdForUpdate(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        validateDocumentSource(originalDoc, currentUser);
        Notebook targetNotebook = resolveOwnedNotebook(request, currentUser);

        MarketplaceCloneReceipt receipt = cloneReceiptRepository
                .findByUserIdAndTargetTypeAndSourceId(
                        currentUser.getId(), MarketplaceCloneTargetType.DOCUMENT, documentId)
                .orElse(null);

        Document existingClone = findExistingDocumentClone(receipt, currentUser, originalDoc);
        if (existingClone != null) {
            linkDocumentToNotebook(existingClone, targetNotebook);
            log.info("Returning existing Document clone id={} for user id={} and source id={}",
                    existingClone.getId(), currentUser.getId(), documentId);
            return DocumentResponseMapper.toResponse(existingClone);
        }

        Document clonedDoc = Document.builder()
                .user(currentUser)
                .subject(originalDoc.getSubject())
                .title(originalDoc.getTitle())
                .description(originalDoc.getDescription())
                .fileUrl(originalDoc.getFileUrl())
                .cloudFilePath(originalDoc.getCloudFilePath())
                .fileType(originalDoc.getFileType())
                .fileSize(originalDoc.getFileSize())
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .processingStatus(ProcessingStatus.SUCCESS)
                .clonedFrom(originalDoc)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();
        Document savedDoc = documentRepository.save(clonedDoc);
        linkDocumentToNotebook(savedDoc, targetNotebook);

        boolean firstCloneCredit = receipt == null;
        saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.DOCUMENT, documentId, savedDoc.getId());
        if (firstCloneCredit) {
            originalDoc.setDownloadCount(safeDownloadCount(originalDoc.getDownloadCount()) + 1);
        }

        log.info("User id={} successfully cloned Document id={} to cloned Document id={}",
                currentUser.getId(), documentId, savedDoc.getId());
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
        User currentUser = userService.getCurrentUser();
        Quiz originalQuiz = cloneLockRepository.findQuizByIdForUpdate(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        validateQuizSource(originalQuiz, currentUser);
        Notebook targetNotebook = resolveOwnedNotebook(request, currentUser);

        MarketplaceCloneReceipt receipt = cloneReceiptRepository
                .findByUserIdAndTargetTypeAndSourceId(
                        currentUser.getId(), MarketplaceCloneTargetType.QUIZ, quizId)
                .orElse(null);

        Quiz existingClone = findExistingQuizClone(receipt, currentUser, originalQuiz);
        if (existingClone != null) {
            if (targetNotebook != null
                    && (existingClone.getNotebook() == null
                    || !existingClone.getNotebook().getId().equals(targetNotebook.getId()))) {
                existingClone.setNotebook(targetNotebook);
                existingClone = quizRepository.save(existingClone);
            }
            log.info("Returning existing Quiz clone id={} for user id={} and source id={}",
                    existingClone.getId(), currentUser.getId(), quizId);
            return QuizResponseMapper.toResponse(existingClone);
        }

        Quiz clonedQuiz = Quiz.builder()
                .creator(currentUser)
                .notebook(targetNotebook)
                .subject(originalQuiz.getSubject())
                .title(originalQuiz.getTitle())
                .description(originalQuiz.getDescription())
                .academicTerm(originalQuiz.getAcademicTerm())
                .examType(originalQuiz.getExamType())
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .clonedFrom(originalQuiz)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();
        Quiz savedQuiz = quizRepository.save(clonedQuiz);

        List<QuizQuestion> originalQuestions = quizQuestionRepository.findByQuizIdOrderById(quizId);
        List<QuizQuestion> clonedQuestions = new ArrayList<>();

        for (QuizQuestion origQ : originalQuestions) {
            QuizQuestion clonedQ = QuizQuestion.builder()
                    .quiz(savedQuiz)
                    .questionText(origQ.getQuestionText())
                    .questionType(origQ.getQuestionType())
                    .explanation(origQ.getExplanation())
                    .build();

            List<QuizOption> clonedOptions = new ArrayList<>();
            for (QuizOption origOpt : origQ.getOptions()) {
                QuizOption clonedOpt = QuizOption.builder()
                        .question(clonedQ)
                        .optionText(origOpt.getOptionText())
                        .isCorrect(origOpt.getIsCorrect())
                        .build();
                clonedOptions.add(clonedOpt);
            }
            clonedQ.setOptions(clonedOptions);
            clonedQuestions.add(clonedQ);
        }

        quizQuestionRepository.saveAll(clonedQuestions);

        boolean firstCloneCredit = receipt == null;
        saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.QUIZ, quizId, savedQuiz.getId());
        if (firstCloneCredit) {
            originalQuiz.setDownloadCount(safeDownloadCount(originalQuiz.getDownloadCount()) + 1);
        }

        log.info("User id={} successfully cloned Quiz id={} to cloned Quiz id={}",
                currentUser.getId(), quizId, savedQuiz.getId());
        return QuizResponseMapper.toResponse(savedQuiz);
    }

    private void validateDocumentSource(Document originalDoc, User currentUser) {
        if (originalDoc.getVisibility() != Visibility.MARKETPLACE
                || originalDoc.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }
        if (originalDoc.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "You cannot clone your own marketplace document.");
        }
    }

    private void validateQuizSource(Quiz originalQuiz, User currentUser) {
        if (originalQuiz.getVisibility() != Visibility.MARKETPLACE
                || originalQuiz.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }
        if (originalQuiz.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "You cannot clone your own marketplace quiz.");
        }
    }

    private Notebook resolveOwnedNotebook(MarketplaceCloneRequest request, User currentUser) {
        if (request == null || request.getTargetNotebookId() == null) {
            return null;
        }

        Notebook notebook = notebookRepository.findById(request.getTargetNotebookId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
        if (!notebook.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
        }
        return notebook;
    }

    private Document findExistingDocumentClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            Document originalDoc) {
        if (receipt == null || receipt.getClonedResourceId() == null) {
            return null;
        }

        return documentRepository.findById(receipt.getClonedResourceId())
                .filter(document -> document.getUser().getId().equals(currentUser.getId()))
                .filter(document -> document.getClonedFrom() != null
                        && document.getClonedFrom().getId().equals(originalDoc.getId()))
                .orElse(null);
    }

    private Quiz findExistingQuizClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            Quiz originalQuiz) {
        if (receipt == null || receipt.getClonedResourceId() == null) {
            return null;
        }

        return quizRepository.findById(receipt.getClonedResourceId())
                .filter(quiz -> quiz.getCreator().getId().equals(currentUser.getId()))
                .filter(quiz -> quiz.getClonedFrom() != null
                        && quiz.getClonedFrom().getId().equals(originalQuiz.getId()))
                .orElse(null);
    }

    private FlashcardDeck findExistingFlashcardDeckClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            FlashcardDeck originalDeck) {
        if (receipt == null || receipt.getClonedResourceId() == null) {
            return null;
        }

        return flashcardDeckRepository.findById(receipt.getClonedResourceId())
                .filter(deck -> deck.getUser().getId().equals(currentUser.getId()))
                .filter(deck -> deck.getClonedFrom() != null
                        && deck.getClonedFrom().getId().equals(originalDeck.getId()))
                .orElse(null);
    }

    private void linkDocumentToNotebook(Document document, Notebook targetNotebook) {
        if (targetNotebook == null
                || notebookDocumentRepository.existsByNotebookIdAndDocumentId(
                        targetNotebook.getId(), document.getId())) {
            return;
        }

        notebookDocumentRepository.save(NotebookDocument.builder()
                .notebook(targetNotebook)
                .document(document)
                .build());
    }

    private void saveCloneReceipt(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            MarketplaceCloneTargetType targetType,
            Long sourceId,
            Long clonedResourceId) {
        MarketplaceCloneReceipt receiptToSave = receipt;
        if (receiptToSave == null) {
            receiptToSave = MarketplaceCloneReceipt.builder()
                    .user(currentUser)
                    .targetType(targetType)
                    .sourceId(sourceId)
                    .build();
        }
        receiptToSave.setClonedResourceId(clonedResourceId);
        cloneReceiptRepository.save(receiptToSave);
    }

    private int safeDownloadCount(Integer downloadCount) {
        return downloadCount != null ? downloadCount : 0;
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
        FlashcardDeck originalDeck = cloneLockRepository.findFlashcardDeckByIdForUpdate(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        // 3. Kiểm tra bảo mật: Bộ thẻ phải ở chế độ MARKETPLACE và trạng thái APPROVED (Đã duyệt)
        if (originalDeck.getVisibility() != Visibility.MARKETPLACE
                || originalDeck.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }
        if (originalDeck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "You cannot clone your own marketplace flashcard deck.");
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

        MarketplaceCloneReceipt receipt = cloneReceiptRepository
                .findByUserIdAndTargetTypeAndSourceId(
                        currentUser.getId(), MarketplaceCloneTargetType.FLASHCARD_DECK, deckId)
                .orElse(null);

        FlashcardDeck existingClone = findExistingFlashcardDeckClone(receipt, currentUser, originalDeck);
        if (existingClone != null) {
            if (targetNotebook != null
                    && (existingClone.getNotebook() == null
                    || !existingClone.getNotebook().getId().equals(targetNotebook.getId()))) {
                existingClone.setNotebook(targetNotebook);
                existingClone = flashcardDeckRepository.save(existingClone);
            }
            log.info("Returning existing FlashcardDeck clone id={} for user id={} and source id={}",
                    existingClone.getId(), currentUser.getId(), deckId);
            return FlashcardDeckResponseMapper.toResponse(existingClone);
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
        boolean firstCloneCredit = receipt == null;
        saveCloneReceipt(
                receipt,
                currentUser,
                MarketplaceCloneTargetType.FLASHCARD_DECK,
                deckId,
                savedDeck.getId());
        if (firstCloneCredit) {
            originalDeck.setDownloadCount(safeDownloadCount(originalDeck.getDownloadCount()) + 1);
        }

        log.info("User id={} successfully cloned FlashcardDeck id={} to cloned Deck id={}",
                currentUser.getId(), deckId, savedDeck.getId());

        // Trả về DTO thông qua Mapper của FlashcardDeck
        return FlashcardDeckResponseMapper.toResponse(savedDeck);
    }
}
