package com.aistudyhub.module.governance.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.service.ChatMessageMapper;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.governance.dto.AdminGovernanceItemResponse;
import com.aistudyhub.module.governance.dto.AdminGovernancePreviewResponse;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.quiz.dto.OptionResponse;
import com.aistudyhub.module.quiz.dto.QuestionResponse;
import com.aistudyhub.repository.ChatMessageRepository;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.FlashcardRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminContentGovernanceService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 100;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final FlashcardRepository flashcardRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageMapper chatMessageMapper;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PaginationResponse<AdminGovernanceItemResponse> listDocuments(String keyword, int page, int size) {
        Page<Document> result = documentRepository.findAll(
                documentKeywordSpec(keyword),
                pageable(page, size));
        return PaginationResponse.of(result.map(this::toDocumentItem));
    }

    @Transactional(readOnly = true)
    public PaginationResponse<AdminGovernanceItemResponse> listQuizzes(String keyword, int page, int size) {
        Page<Quiz> result = quizRepository.findAll(
                quizKeywordSpec(keyword),
                pageable(page, size));
        return PaginationResponse.of(result.map(this::toQuizItem));
    }

    @Transactional(readOnly = true)
    public PaginationResponse<AdminGovernanceItemResponse> listFlashcards(String keyword, int page, int size) {
        Page<FlashcardDeck> result = flashcardDeckRepository.findAll(
                flashcardKeywordSpec(keyword),
                pageable(page, size));
        return PaginationResponse.of(result.map(this::toFlashcardItem));
    }

    @Transactional(readOnly = true)
    public PaginationResponse<AdminGovernanceItemResponse> listChatSessions(String keyword, int page, int size) {
        Page<ChatSession> result = chatSessionRepository.findAll(
                chatSessionKeywordSpec(keyword),
                pageable(page, size));
        return PaginationResponse.of(result.map(this::toChatSessionItem));
    }

    @Transactional
    public AdminGovernancePreviewResponse previewContent(String targetType, Long targetId, Long adminUserId) {
        ActivityTargetType parsedTargetType = parseTargetType(targetType);
        return switch (parsedTargetType) {
            case DOCUMENT -> previewDocument(targetId, adminUserId);
            case QUIZ -> previewQuiz(targetId, adminUserId);
            case FLASHCARD_DECK -> previewFlashcardDeck(targetId, adminUserId);
            case CHAT_SESSION -> previewChatSession(targetId, adminUserId);
            default -> throw new AppException(ErrorCode.INVALID_REPORT_TARGET, "Unsupported governance target type");
        };
    }

    @Transactional
    public AdminGovernanceItemResponse warnOwner(String targetType, Long targetId, Long adminUserId, String reason) {
        ActivityTargetType parsedTargetType = parseTargetType(targetType);
        AdminGovernanceItemResponse item = resolveItem(parsedTargetType, targetId);
        if (item.getOwnerId() == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND, "Content owner not found");
        }

        String normalizedReason = StringUtils.hasText(reason) ? reason.replaceAll("\\s+", " ").trim() : null;
        notificationService.createNotification(
                item.getOwnerId(),
                "Admin cảnh báo nội dung của bạn",
                "Admin đã cảnh báo " + displayTargetType(parsedTargetType) + " \"" + item.getTitle() + "\"."
                        + (StringUtils.hasText(normalizedReason) ? " Lý do: " + normalizedReason : ""));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("title", item.getTitle());
        metadata.put("ownerId", item.getOwnerId());
        metadata.put("ownerEmail", item.getOwnerEmail());
        metadata.put("reason", normalizedReason);
        metadata.put("warnedAt", LocalDateTime.now().toString());
        activityLogService.log(adminUserId, ActivityActionType.ADMIN_WARN_CONTENT, parsedTargetType, targetId,
                metadata, item.getTitle(), item.getOwnerEmail(), normalizedReason);

        return item;
    }

    private AdminGovernanceItemResponse resolveItem(ActivityTargetType targetType, Long targetId) {
        return switch (targetType) {
            case DOCUMENT -> toDocumentItem(documentRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND)));
            case QUIZ -> toQuizItem(quizRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND)));
            case FLASHCARD_DECK -> toFlashcardItem(flashcardDeckRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND)));
            case CHAT_SESSION -> toChatSessionItem(chatSessionRepository.findById(targetId)
                    .orElseThrow(() -> new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND)));
            default -> throw new AppException(ErrorCode.INVALID_REPORT_TARGET, "Unsupported governance target type");
        };
    }

    private AdminGovernancePreviewResponse previewDocument(Long documentId, Long adminUserId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        List<DocumentChunkResponse> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId)
                .stream()
                .map(this::toChunkResponse)
                .toList();

        notifyAndLogPreview(adminUserId, ActivityTargetType.DOCUMENT, documentId, title(document), owner(document), document);

        return basePreviewFromItem(toDocumentItem(document))
                .chunks(chunks)
                .questions(List.of())
                .cards(List.of())
                .messages(List.of())
                .build();
    }

    private AdminGovernancePreviewResponse previewQuiz(Long quizId, Long adminUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        List<QuestionResponse> questions = quizQuestionRepository.findByQuizIdOrderById(quizId)
                .stream()
                .map(this::toQuestionResponse)
                .toList();

        notifyAndLogPreview(adminUserId, ActivityTargetType.QUIZ, quizId, title(quiz), owner(quiz), quiz);

        return basePreviewFromItem(toQuizItem(quiz))
                .chunks(List.of())
                .questions(questions)
                .cards(List.of())
                .messages(List.of())
                .build();
    }

    private AdminGovernancePreviewResponse previewFlashcardDeck(Long deckId, Long adminUserId) {
        FlashcardDeck deck = flashcardDeckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        List<FlashcardResponse> cards = flashcardRepository.findByDeckIdOrderById(deckId)
                .stream()
                .map(this::toFlashcardResponse)
                .toList();

        notifyAndLogPreview(adminUserId, ActivityTargetType.FLASHCARD_DECK, deckId, title(deck), owner(deck), deck);

        return basePreviewFromItem(toFlashcardItem(deck))
                .chunks(List.of())
                .questions(List.of())
                .cards(cards)
                .messages(List.of())
                .build();
    }

    private AdminGovernancePreviewResponse previewChatSession(Long sessionId, Long adminUserId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        if (!canAdminPreviewChat(session)) {
            throw new AppException(ErrorCode.ACCESS_DENIED,
                    "Admin chỉ được xem phiên chat khi user cho phép hoặc user đã report phiên này.");
        }

        List<ChatMessageResponse> messages = chatMessageRepository.findBySessionIdOrderByMessageSequenceAsc(sessionId)
                .stream()
                .map(chatMessageMapper::toResponse)
                .toList();

        notifyAndLogPreview(adminUserId, ActivityTargetType.CHAT_SESSION, sessionId, title(session), owner(session), session);

        return basePreviewFromItem(toChatSessionItem(session))
                .chunks(List.of())
                .questions(List.of())
                .cards(List.of())
                .messages(messages)
                .build();
    }

    private AdminGovernanceItemResponse toDocumentItem(Document document) {
        User owner = owner(document);
        Subject subject = document.getSubject();
        return AdminGovernanceItemResponse.builder()
                .targetType(ActivityTargetType.DOCUMENT)
                .targetId(document.getId())
                .title(title(document))
                .description(document.getDescription())
                .ownerId(id(owner))
                .ownerName(name(owner))
                .ownerEmail(email(owner))
                .subjectId(id(subject))
                .subjectCode(code(subject))
                .subjectName(subjectName(subject))
                .visibility(enumName(document.getVisibility()))
                .marketStatus(enumName(document.getMarketStatus()))
                .processingStatus(enumName(document.getProcessingStatus()))
                .moderationStatus(enumName(document.getModerationStatus()))
                .violationSeverity(enumName(document.getViolationSeverity()))
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .aiGenerated(false)
                .itemCount(safeLongToInt(documentChunkRepository.countByDocumentId(document.getId())))
                .adminPreviewAllowed(true)
                .accessReason("ADMIN_ROLE")
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    private AdminGovernanceItemResponse toQuizItem(Quiz quiz) {
        User owner = owner(quiz);
        Subject subject = quiz.getSubject();
        Notebook notebook = quiz.getNotebook();
        return AdminGovernanceItemResponse.builder()
                .targetType(ActivityTargetType.QUIZ)
                .targetId(quiz.getId())
                .title(title(quiz))
                .description(quiz.getDescription())
                .examType(quiz.getExamType())
                .ownerId(id(owner))
                .ownerName(name(owner))
                .ownerEmail(email(owner))
                .subjectId(id(subject))
                .subjectCode(code(subject))
                .subjectName(subjectName(subject))
                .notebookId(id(notebook))
                .notebookTitle(title(notebook))
                .visibility(enumName(quiz.getVisibility()))
                .marketStatus(enumName(quiz.getMarketStatus()))
                .aiGenerated(isAiImported(PracticeImportTargetType.QUIZ, quiz.getId()))
                .itemCount(quizQuestionRepository.findByQuizIdOrderById(quiz.getId()).size())
                .adminPreviewAllowed(true)
                .accessReason("ADMIN_ROLE")
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    private AdminGovernanceItemResponse toFlashcardItem(FlashcardDeck deck) {
        User owner = owner(deck);
        Subject subject = deck.getSubject();
        Notebook notebook = deck.getNotebook();
        return AdminGovernanceItemResponse.builder()
                .targetType(ActivityTargetType.FLASHCARD_DECK)
                .targetId(deck.getId())
                .title(title(deck))
                .ownerId(id(owner))
                .ownerName(name(owner))
                .ownerEmail(email(owner))
                .subjectId(id(subject))
                .subjectCode(code(subject))
                .subjectName(subjectName(subject))
                .notebookId(id(notebook))
                .notebookTitle(title(notebook))
                .visibility(enumName(deck.getVisibility()))
                .marketStatus(enumName(deck.getMarketStatus()))
                .aiGenerated(isAiImported(PracticeImportTargetType.FLASHCARD_DECK, deck.getId()))
                .itemCount(flashcardRepository.findByDeckIdOrderById(deck.getId()).size())
                .adminPreviewAllowed(true)
                .accessReason("ADMIN_ROLE")
                .createdAt(deck.getCreatedAt())
                .updatedAt(deck.getUpdatedAt())
                .build();
    }

    private AdminGovernanceItemResponse toChatSessionItem(ChatSession session) {
        User owner = owner(session);
        Notebook notebook = session.getNotebook();
        Subject subject = notebook != null ? notebook.getSubject() : null;
        boolean previewAllowed = canAdminPreviewChat(session);
        return AdminGovernanceItemResponse.builder()
                .targetType(ActivityTargetType.CHAT_SESSION)
                .targetId(session.getId())
                .title(title(session))
                .ownerId(id(owner))
                .ownerName(name(owner))
                .ownerEmail(email(owner))
                .subjectId(id(subject))
                .subjectCode(code(subject))
                .subjectName(subjectName(subject))
                .notebookId(id(notebook))
                .notebookTitle(title(notebook))
                .aiGenerated(chatMessageRepository.countBySessionIdAndSenderRole(session.getId(), "AI") > 0)
                .itemCount(safeLongToInt(chatMessageRepository.countBySessionId(session.getId())))
                .adminPreviewAllowed(previewAllowed)
                .accessReason(chatAccessReason(session))
                .reportReason(session.getAdminReportReason())
                .reportedAt(session.getAdminReportedAt())
                .createdAt(session.getCreatedAt())
                .updatedAt(null)
                .build();
    }

    private AdminGovernancePreviewResponse.AdminGovernancePreviewResponseBuilder basePreviewFromItem(
            AdminGovernanceItemResponse item) {
        return AdminGovernancePreviewResponse.builder()
                .targetType(item.getTargetType())
                .targetId(item.getTargetId())
                .title(item.getTitle())
                .description(item.getDescription())
                .examType(item.getExamType())
                .ownerId(item.getOwnerId())
                .ownerName(item.getOwnerName())
                .ownerEmail(item.getOwnerEmail())
                .subjectId(item.getSubjectId())
                .subjectCode(item.getSubjectCode())
                .subjectName(item.getSubjectName())
                .notebookId(item.getNotebookId())
                .notebookTitle(item.getNotebookTitle())
                .visibility(item.getVisibility())
                .marketStatus(item.getMarketStatus())
                .processingStatus(item.getProcessingStatus())
                .moderationStatus(item.getModerationStatus())
                .violationSeverity(item.getViolationSeverity())
                .fileType(item.getFileType())
                .fileSize(item.getFileSize())
                .aiGenerated(item.getAiGenerated())
                .adminPreviewAllowed(item.getAdminPreviewAllowed())
                .accessReason(item.getAccessReason())
                .reportReason(item.getReportReason())
                .reportedAt(item.getReportedAt())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt());
    }

    private DocumentChunkResponse toChunkResponse(DocumentChunk chunk) {
        Document document = chunk.getDocument();
        return DocumentChunkResponse.builder()
                .id(chunk.getId())
                .documentId(document != null ? document.getId() : null)
                .documentTitle(document != null ? document.getTitle() : null)
                .chunkIndex(chunk.getChunkIndex())
                .textContent(chunk.getTextContent())
                .tokenEstimate(chunk.getTokenEstimate())
                .sourcePage(chunk.getSourcePage())
                .sourceSection(chunk.getSourceSection())
                .vectorId(chunk.getVectorId())
                .build();
    }

    private QuestionResponse toQuestionResponse(QuizQuestion question) {
        List<OptionResponse> options = question.getOptions() == null ? List.of() : question.getOptions().stream()
                .map(option -> OptionResponse.builder()
                        .id(option.getId())
                        .optionText(option.getOptionText())
                        .isCorrect(option.getIsCorrect())
                        .build())
                .toList();
        return QuestionResponse.builder()
                .id(question.getId())
                .quizId(question.getQuiz() != null ? question.getQuiz().getId() : null)
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .options(options)
                .build();
    }

    private FlashcardResponse toFlashcardResponse(Flashcard card) {
        return FlashcardResponse.builder()
                .id(card.getId())
                .deckId(card.getDeck() != null ? card.getDeck().getId() : null)
                .frontText(card.getFrontText())
                .backText(card.getBackText())
                .build();
    }

    private Specification<Document> documentKeywordSpec(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = pattern(keyword);
            Join<Document, User> user = root.join("user", JoinType.LEFT);
            Join<Document, Subject> subject = root.join("subject", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(user.get("fullName")), pattern),
                    cb.like(cb.lower(user.get("email")), pattern),
                    cb.like(cb.lower(subject.get("code")), pattern),
                    cb.like(cb.lower(subject.get("name")), pattern));
        };
    }

    private Specification<Quiz> quizKeywordSpec(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = pattern(keyword);
            Join<Quiz, User> user = root.join("creator", JoinType.LEFT);
            Join<Quiz, Subject> subject = root.join("subject", JoinType.LEFT);
            Join<Quiz, Notebook> notebook = root.join("notebook", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("examType")), pattern),
                    cb.like(cb.lower(user.get("fullName")), pattern),
                    cb.like(cb.lower(user.get("email")), pattern),
                    cb.like(cb.lower(subject.get("code")), pattern),
                    cb.like(cb.lower(subject.get("name")), pattern),
                    cb.like(cb.lower(notebook.get("title")), pattern));
        };
    }

    private Specification<FlashcardDeck> flashcardKeywordSpec(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = pattern(keyword);
            Join<FlashcardDeck, User> user = root.join("user", JoinType.LEFT);
            Join<FlashcardDeck, Subject> subject = root.join("subject", JoinType.LEFT);
            Join<FlashcardDeck, Notebook> notebook = root.join("notebook", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(user.get("fullName")), pattern),
                    cb.like(cb.lower(user.get("email")), pattern),
                    cb.like(cb.lower(subject.get("code")), pattern),
                    cb.like(cb.lower(subject.get("name")), pattern),
                    cb.like(cb.lower(notebook.get("title")), pattern));
        };
    }

    private Specification<ChatSession> chatSessionKeywordSpec(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = pattern(keyword);
            Join<ChatSession, User> user = root.join("user", JoinType.LEFT);
            Join<ChatSession, Notebook> notebook = root.join("notebook", JoinType.LEFT);
            Join<Notebook, Subject> subject = notebook.join("subject", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("adminReportReason")), pattern),
                    cb.like(cb.lower(user.get("fullName")), pattern),
                    cb.like(cb.lower(user.get("email")), pattern),
                    cb.like(cb.lower(notebook.get("title")), pattern),
                    cb.like(cb.lower(subject.get("code")), pattern),
                    cb.like(cb.lower(subject.get("name")), pattern));
        };
    }

    private PageRequest pageable(int page, int size) {
        int safePage = Math.max(page, DEFAULT_PAGE);
        int safeSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private ActivityTargetType parseTargetType(String targetType) {
        if (!StringUtils.hasText(targetType)) {
            throw new AppException(ErrorCode.INVALID_REPORT_TARGET, "targetType is required");
        }
        try {
            return ActivityTargetType.valueOf(targetType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REPORT_TARGET, "Unsupported governance target type");
        }
    }

    private boolean canAdminPreviewChat(ChatSession session) {
        if (Boolean.TRUE.equals(session.getReportedToAdmin())) {
            return true;
        }
        if (Boolean.TRUE.equals(session.getIsPrivate())) {
            return false;
        }
        return Boolean.TRUE.equals(session.getAdminAccessAllowed());
    }

    private String chatAccessReason(ChatSession session) {
        if (Boolean.TRUE.equals(session.getReportedToAdmin())) {
            return "USER_REPORTED";
        }
        if (Boolean.TRUE.equals(session.getIsPrivate())) {
            return "PRIVATE_REQUIRES_USER_REPORT";
        }
        if (Boolean.TRUE.equals(session.getAdminAccessAllowed())) {
            return "USER_ALLOWED_ADMIN_PREVIEW";
        }
        return "USER_PERMISSION_REQUIRED";
    }

    private void notifyAndLogPreview(Long adminUserId,
                                     ActivityTargetType targetType,
                                     Long targetId,
                                     String title,
                                     User owner,
                                     Object source) {
        if (owner != null && owner.getId() != null && !owner.getId().equals(adminUserId)) {
            try {
                notificationService.createNotification(
                        owner.getId(),
                        "Admin đã xem trước nội dung của bạn",
                        "Admin vừa preview " + displayTargetType(targetType) + " \"" + title + "\" để kiểm tra an toàn nội dung.");
            } catch (Exception ex) {
                log.warn("Failed to notify owner {} about admin preview {} {}", owner.getId(), targetType, targetId, ex);
            }
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("title", title);
        metadata.put("ownerId", owner != null ? owner.getId() : null);
        metadata.put("ownerEmail", owner != null ? owner.getEmail() : null);
        metadata.put("previewedAt", LocalDateTime.now().toString());
        metadata.put("sourceClass", source != null ? source.getClass().getSimpleName() : null);
        activityLogService.log(adminUserId, ActivityActionType.ADMIN_PREVIEW_CONTENT, targetType, targetId,
                metadata, title, owner != null ? owner.getEmail() : null, targetType.name());
    }

    private boolean isAiImported(PracticeImportTargetType targetType, Long targetId) {
        return targetId != null && chatMessageRepository.existsByImportedTargetTypeAndImportedTargetId(targetType, targetId);
    }

    private String displayTargetType(ActivityTargetType targetType) {
        return switch (targetType) {
            case DOCUMENT -> "tài liệu";
            case QUIZ -> "quiz";
            case FLASHCARD_DECK -> "bộ flashcard";
            case CHAT_SESSION -> "phiên chat";
            default -> "nội dung";
        };
    }

    private String pattern(String keyword) {
        return "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private int safeLongToInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }

    private String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }

    private Long id(User user) {
        return user != null ? user.getId() : null;
    }

    private Long id(Subject subject) {
        return subject != null ? subject.getId() : null;
    }

    private Long id(Notebook notebook) {
        return notebook != null ? notebook.getId() : null;
    }

    private String name(User user) {
        return user != null ? user.getFullName() : null;
    }

    private String email(User user) {
        return user != null ? user.getEmail() : null;
    }

    private String code(Subject subject) {
        return subject != null ? subject.getCode() : null;
    }

    private String subjectName(Subject subject) {
        return subject != null ? subject.getName() : null;
    }

    private User owner(Document document) {
        return document != null ? document.getUser() : null;
    }

    private User owner(Quiz quiz) {
        return quiz != null ? quiz.getCreator() : null;
    }

    private User owner(FlashcardDeck deck) {
        return deck != null ? deck.getUser() : null;
    }

    private User owner(ChatSession session) {
        return session != null ? session.getUser() : null;
    }

    private String title(Document document) {
        return document != null ? document.getTitle() : null;
    }

    private String title(Quiz quiz) {
        return quiz != null ? quiz.getTitle() : null;
    }

    private String title(FlashcardDeck deck) {
        return deck != null ? deck.getTitle() : null;
    }

    private String title(ChatSession session) {
        return StringUtils.hasText(session.getTitle()) ? session.getTitle() : "Phiên chat #" + session.getId();
    }

    private String title(Notebook notebook) {
        return notebook != null ? notebook.getTitle() : null;
    }
}
