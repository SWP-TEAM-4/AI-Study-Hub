package com.aistudyhub.module.marketplace.service;

import com.aistudyhub.repository.QuizRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponseMapper;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizResponseMapper;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;

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

    /**
     * Gửi yêu cầu đăng tải một tài liệu học tập (Document) lên Marketplace.
     * 
     * @param documentId ID của tài liệu cần đăng tải
     * @param note       Ghi chú đăng tải từ người dùng
     * @return DocumentResponse chứa thông tin tài liệu đã cập nhật trạng thái xuất bản
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
        // Bước 7: Cập nhật Visibility, MarketStatus và SubmitNote
        document.setVisibility(Visibility.MARKETPLACE);
        document.setMarketStatus(MarketStatus.PENDING);
        document.setSubmitNote(note);
        // Bước 8: Lưu thực thể đã cập nhật vào DB
        Document savedDoc = documentRepository.save(document);
        log.info("Document id={} has been submitted to the marketplace by userId={}", documentId, currentUserId);
        // Bước 9: Trả về DTO thông qua Mapper
        return DocumentResponseMapper.toResponse(savedDoc);
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
        // Bước 7: Cập nhật Visibility, MarketStatus và SubmitNote
        quiz.setVisibility(Visibility.MARKETPLACE);
        quiz.setMarketStatus(MarketStatus.PENDING);
        quiz.setSubmitNote(note);
        // Bước 8: Lưu thực thể và ghi log
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Quiz id={} has been submitted to the marketplace by userId={}", quizId, currentUserId);
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
        // Bước 6: Cập nhật Visibility, MarketStatus và SubmitNote
        deck.setVisibility(Visibility.MARKETPLACE);
        deck.setMarketStatus(MarketStatus.PENDING);
        deck.setSubmitNote(note);
        // Bước 7: Lưu thực thể và ghi log
        FlashcardDeck savedDeck = flashcardDeckRepository.save(deck);
        log.info("FlashcardDeck id={} has been submitted to the marketplace by userId={}", deckId, currentUserId);
        // Bước 8: Trả về DTO thông qua Mapper
        return FlashcardDeckResponseMapper.toResponse(savedDeck);
    }

}
