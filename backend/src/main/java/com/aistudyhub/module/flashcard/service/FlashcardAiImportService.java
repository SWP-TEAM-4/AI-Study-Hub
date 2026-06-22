package com.aistudyhub.module.flashcard.service;

import com.aistudyhub.common.enums.PracticeImportTargetMode;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.module.chat.dto.practice.FlashcardGeneratedPayload;
import com.aistudyhub.module.chat.dto.practice.PracticeImportRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.FlashcardDeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FlashcardAiImportService {

    private final FlashcardDeckRepository flashcardDeckRepository;
    private final FlashcardService flashcardService;
    private final FlashcardBulkCardImportService flashcardBulkCardImportService;
    private final UserService userService;

    @Transactional
    public ImportResult importFromChatDraft(ChatSession session, FlashcardGeneratedPayload payload,
                                            PracticeImportRequest request) {
        try {
            FlashcardDeck targetDeck;
            Long createdDeckId = null;

            if (request.getTargetMode() == PracticeImportTargetMode.CREATE_NEW) {
                FlashcardDeckRequest deckRequest = new FlashcardDeckRequest();
                String title = normalize(request.getTarget().getTitle());
                if (title == null) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_TARGET_INVALID,
                            "title is required when creating a new flashcard deck");
                }
                deckRequest.setTitle(title);
                deckRequest.setNotebookId(request.getTarget().getNotebookId() != null
                        ? request.getTarget().getNotebookId()
                        : session.getNotebook().getId());
                deckRequest.setSubjectId(request.getTarget().getSubjectId() != null
                        ? request.getTarget().getSubjectId()
                        : (session.getNotebook().getSubject() != null ? session.getNotebook().getSubject().getId() : null));
                deckRequest.setVisibility(request.getTarget().getVisibility() != null
                        ? request.getTarget().getVisibility()
                        : Visibility.PRIVATE);

                FlashcardDeckResponse response = flashcardService.createDeck(deckRequest);
                targetDeck = flashcardDeckRepository.findById(response.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                createdDeckId = response.getId();
            } else {
                if (request.getTarget().getDeckId() == null) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_TARGET_INVALID,
                            "deckId is required when appending to an existing deck");
                }
                targetDeck = flashcardDeckRepository.findById(request.getTarget().getDeckId())
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                if (!targetDeck.getUser().getId().equals(userService.getCurrentUserId())) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_PERMISSION_DENIED,
                            "You do not own the target flashcard deck");
                }
            }

            boolean skipDuplicates = request.getImportOptions() != null
                    && Boolean.TRUE.equals(request.getImportOptions().getSkipDuplicateCards());

            FlashcardBulkCardImportService.ImportResult importResult = flashcardBulkCardImportService.importCards(
                    targetDeck,
                    payload.getCards(),
                    skipDuplicates
            );

            return new ImportResult(
                    PracticeImportTargetType.FLASHCARD_DECK,
                    targetDeck.getId(),
                    createdDeckId,
                    importResult.createdCards(),
                    importResult.skippedDuplicates()
            );
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.FLASHCARD_IMPORT_FAILED, ex.getMessage());
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public record ImportResult(
            PracticeImportTargetType targetType,
            Long targetId,
            Long createdDeckId,
            int createdCards,
            int skippedDuplicates
    ) {
    }
}
