package com.aistudyhub.module.marketplace.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponseMapper;
import com.aistudyhub.module.marketplace.dto.MarketplaceCloneRequest;
import com.aistudyhub.module.marketplace.entity.MarketplaceCloneReceipt;
import com.aistudyhub.module.marketplace.model.MarketplaceCloneTargetType;
import com.aistudyhub.module.marketplace.repository.MarketplaceCloneLockRepository;
import com.aistudyhub.module.marketplace.repository.MarketplaceCloneReceiptRepository;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizResponseMapper;
import com.aistudyhub.module.reputation.service.ReputationService;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xu ly clone tai nguyen tu Marketplace ve khong gian ca nhan.
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
    private final ReputationService reputationService;
    private final MarketplaceCloneReceiptRepository cloneReceiptRepository;
    private final MarketplaceCloneLockRepository cloneLockRepository;

    @Transactional
    public DocumentResponse cloneDocumentInMarket(Long documentId, MarketplaceCloneRequest request) {
        User currentUser = userService.getCurrentUser();
        Document originalDoc = cloneLockRepository.findDocumentByIdForUpdate(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        validateDocumentSource(originalDoc, currentUser);
        Notebook targetNotebook = resolveOwnedNotebook(request, currentUser);

        MarketplaceCloneReceipt receipt = findReceipt(
                currentUser,
                MarketplaceCloneTargetType.DOCUMENT,
                documentId);

        Document existingClone = findExistingDocumentClone(receipt, currentUser, originalDoc);
        if (existingClone != null) {
            saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.DOCUMENT, documentId, existingClone.getId());
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
            documentRepository.save(originalDoc);
            rewardMarketplaceClone(
                    originalDoc.getUser(),
                    originalDoc.getSubject() != null ? originalDoc.getSubject().getId() : null,
                    "DOCUMENT",
                    originalDoc.getId(),
                    savedDoc.getId(),
                    originalDoc.getDownloadCount(),
                    currentUser);
        }

        log.info("User id={} successfully cloned Document id={} to cloned Document id={}",
                currentUser.getId(), documentId, savedDoc.getId());
        return DocumentResponseMapper.toResponse(savedDoc);
    }

    @Transactional
    public QuizResponse cloneQuizInMarket(Long quizId, MarketplaceCloneRequest request) {
        User currentUser = userService.getCurrentUser();
        Quiz originalQuiz = cloneLockRepository.findQuizByIdForUpdate(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        validateQuizSource(originalQuiz, currentUser);
        Notebook targetNotebook = resolveOwnedNotebook(request, currentUser);

        MarketplaceCloneReceipt receipt = findReceipt(
                currentUser,
                MarketplaceCloneTargetType.QUIZ,
                quizId);

        Quiz existingClone = findExistingQuizClone(receipt, currentUser, originalQuiz);
        if (existingClone != null) {
            saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.QUIZ, quizId, existingClone.getId());
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
                clonedOptions.add(QuizOption.builder()
                        .question(clonedQ)
                        .optionText(origOpt.getOptionText())
                        .isCorrect(origOpt.getIsCorrect())
                        .build());
            }
            clonedQ.setOptions(clonedOptions);
            clonedQuestions.add(clonedQ);
        }
        quizQuestionRepository.saveAll(clonedQuestions);

        boolean firstCloneCredit = receipt == null;
        saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.QUIZ, quizId, savedQuiz.getId());
        if (firstCloneCredit) {
            originalQuiz.setDownloadCount(safeDownloadCount(originalQuiz.getDownloadCount()) + 1);
            quizRepository.save(originalQuiz);
            rewardMarketplaceClone(
                    originalQuiz.getCreator(),
                    originalQuiz.getSubject() != null ? originalQuiz.getSubject().getId() : null,
                    "QUIZ",
                    originalQuiz.getId(),
                    savedQuiz.getId(),
                    originalQuiz.getDownloadCount(),
                    currentUser);
        }

        log.info("User id={} successfully cloned Quiz id={} to cloned Quiz id={}",
                currentUser.getId(), quizId, savedQuiz.getId());
        return QuizResponseMapper.toResponse(savedQuiz);
    }

    @Transactional
    public FlashcardDeckResponse cloneFlashcardDeckInMarket(Long deckId, MarketplaceCloneRequest request) {
        User currentUser = userService.getCurrentUser();
        FlashcardDeck originalDeck = cloneLockRepository.findFlashcardDeckByIdForUpdate(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        validateFlashcardDeckSource(originalDeck, currentUser);
        Notebook targetNotebook = resolveOwnedNotebook(request, currentUser);

        MarketplaceCloneReceipt receipt = findReceipt(
                currentUser,
                MarketplaceCloneTargetType.FLASHCARD_DECK,
                deckId);

        FlashcardDeck existingClone = findExistingFlashcardDeckClone(receipt, currentUser, originalDeck);
        if (existingClone != null) {
            saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.FLASHCARD_DECK, deckId, existingClone.getId());
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

        FlashcardDeck clonedDeck = FlashcardDeck.builder()
                .user(currentUser)
                .notebook(targetNotebook)
                .subject(originalDeck.getSubject())
                .title(originalDeck.getTitle())
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .clonedFrom(originalDeck)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();

        List<Flashcard> clonedCards = new ArrayList<>();
        if (originalDeck.getCards() != null) {
            for (Flashcard origCard : originalDeck.getCards()) {
                clonedCards.add(Flashcard.builder()
                        .deck(clonedDeck)
                        .frontText(origCard.getFrontText())
                        .backText(origCard.getBackText())
                        .build());
            }
        }
        clonedDeck.setCards(clonedCards);
        FlashcardDeck savedDeck = flashcardDeckRepository.save(clonedDeck);

        boolean firstCloneCredit = receipt == null;
        saveCloneReceipt(receipt, currentUser, MarketplaceCloneTargetType.FLASHCARD_DECK, deckId, savedDeck.getId());
        if (firstCloneCredit) {
            originalDeck.setDownloadCount(safeDownloadCount(originalDeck.getDownloadCount()) + 1);
            flashcardDeckRepository.save(originalDeck);
            rewardMarketplaceClone(
                    originalDeck.getUser(),
                    originalDeck.getSubject() != null ? originalDeck.getSubject().getId() : null,
                    "FLASHCARD_DECK",
                    originalDeck.getId(),
                    savedDeck.getId(),
                    originalDeck.getDownloadCount(),
                    currentUser);
        }

        log.info("User id={} successfully cloned FlashcardDeck id={} to cloned Deck id={}",
                currentUser.getId(), deckId, savedDeck.getId());
        return FlashcardDeckResponseMapper.toResponse(savedDeck);
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

    private void validateFlashcardDeckSource(FlashcardDeck originalDeck, User currentUser) {
        if (originalDeck.getVisibility() != Visibility.MARKETPLACE
                || originalDeck.getMarketStatus() != MarketStatus.APPROVED) {
            throw new AppException(ErrorCode.CONTENT_NOT_MARKETPLACE);
        }
        if (originalDeck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "You cannot clone your own marketplace flashcard deck.");
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

    private MarketplaceCloneReceipt findReceipt(
            User currentUser,
            MarketplaceCloneTargetType targetType,
            Long sourceId) {
        return cloneReceiptRepository
                .findByUserIdAndTargetTypeAndSourceId(currentUser.getId(), targetType, sourceId)
                .orElse(null);
    }

    private Document findExistingDocumentClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            Document originalDoc) {
        if (receipt != null && receipt.getClonedResourceId() != null) {
            Document fromReceipt = documentRepository.findById(receipt.getClonedResourceId())
                    .filter(document -> document.getUser().getId().equals(currentUser.getId()))
                    .filter(document -> document.getClonedFrom() != null
                            && document.getClonedFrom().getId().equals(originalDoc.getId()))
                    .orElse(null);
            if (fromReceipt != null) {
                return fromReceipt;
            }
        }

        return documentRepository
                .findFirstByUserIdAndClonedFrom_IdOrderByIdAsc(currentUser.getId(), originalDoc.getId())
                .orElse(null);
    }

    private Quiz findExistingQuizClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            Quiz originalQuiz) {
        if (receipt != null && receipt.getClonedResourceId() != null) {
            Quiz fromReceipt = quizRepository.findById(receipt.getClonedResourceId())
                    .filter(quiz -> quiz.getCreator().getId().equals(currentUser.getId()))
                    .filter(quiz -> quiz.getClonedFrom() != null
                            && quiz.getClonedFrom().getId().equals(originalQuiz.getId()))
                    .orElse(null);
            if (fromReceipt != null) {
                return fromReceipt;
            }
        }

        return quizRepository
                .findFirstByCreatorIdAndClonedFrom_IdOrderByIdAsc(currentUser.getId(), originalQuiz.getId())
                .orElse(null);
    }

    private FlashcardDeck findExistingFlashcardDeckClone(
            MarketplaceCloneReceipt receipt,
            User currentUser,
            FlashcardDeck originalDeck) {
        if (receipt != null && receipt.getClonedResourceId() != null) {
            FlashcardDeck fromReceipt = flashcardDeckRepository.findById(receipt.getClonedResourceId())
                    .filter(deck -> deck.getUser().getId().equals(currentUser.getId()))
                    .filter(deck -> deck.getClonedFrom() != null
                            && deck.getClonedFrom().getId().equals(originalDeck.getId()))
                    .orElse(null);
            if (fromReceipt != null) {
                return fromReceipt;
            }
        }

        return flashcardDeckRepository
                .findFirstByUserIdAndClonedFrom_IdOrderByIdAsc(currentUser.getId(), originalDeck.getId())
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

    private void rewardMarketplaceClone(
            User owner,
            Long subjectId,
            String targetType,
            Long targetId,
            Long clonedId,
            Integer downloadCount,
            User actor) {

        if (owner == null || actor == null || owner.getId().equals(actor.getId())) {
            return;
        }

        reputationService.applyConfiguredEvent(
                owner.getId(),
                subjectId,
                ReputationEventType.MARKETPLACE_CLONE_RECEIVED,
                targetType,
                targetId,
                "MARKETPLACE_CLONE",
                clonedId,
                "Marketplace clone received",
                "MARKETPLACE_CLONE:" + actor.getId() + ":" + targetType + ":" + targetId,
                actor.getId());

        Integer threshold = reputationService.getRuleThreshold(ReputationEventType.CONTENT_DOWNLOAD_MILESTONE);
        if (threshold != null && downloadCount != null && downloadCount > 0 && downloadCount % threshold == 0) {
            reputationService.applyConfiguredEvent(
                    owner.getId(),
                    subjectId,
                    ReputationEventType.CONTENT_DOWNLOAD_MILESTONE,
                    targetType,
                    targetId,
                    "MARKETPLACE_CLONE",
                    clonedId,
                    "Marketplace download milestone " + downloadCount,
                    "CONTENT_DOWNLOAD_MILESTONE:" + targetType + ":" + targetId + ":" + downloadCount,
                    actor.getId());
        }
    }
}
