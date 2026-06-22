package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.ChatMessageType;
import com.aistudyhub.common.enums.PracticeStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.module.chat.dto.practice.FlashcardGeneratedPayload;
import com.aistudyhub.module.chat.dto.practice.PracticeImportRequest;
import com.aistudyhub.module.chat.dto.practice.PracticeImportResponse;
import com.aistudyhub.module.chat.dto.practice.QuizGeneratedPayload;
import com.aistudyhub.module.flashcard.service.FlashcardAiImportService;
import com.aistudyhub.module.quiz.service.QuizAiImportService;
import com.aistudyhub.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatPracticeImportService {

    private final ChatAccessService chatAccessService;
    private final ChatMessageRepository chatMessageRepository;
    private final AiPracticePayloadValidator aiPracticePayloadValidator;
    private final QuizAiImportService quizAiImportService;
    private final FlashcardAiImportService flashcardAiImportService;

    @Transactional
    public PracticeImportResponse importPractice(Long messageId, Long userId, PracticeImportRequest request) {
        ChatMessage message = chatAccessService.resolveOwnedMessage(messageId, userId);
        validateImportableDraft(message);

        LocalDateTime importedAt = LocalDateTime.now();
        if (message.getPracticeType() == AiPracticeType.QUIZ) {
            QuizGeneratedPayload payload = aiPracticePayloadValidator.parseQuizPayload(message.getGeneratedPayload());
            QuizAiImportService.ImportResult result = quizAiImportService.importFromChatDraft(message.getSession(),
                    payload, request);
            message.setPracticeStatus(PracticeStatus.IMPORTED);
            message.setImportedTargetType(result.targetType());
            message.setImportedTargetId(result.targetId());
            message.setImportedAt(importedAt);
            chatMessageRepository.save(message);

            return PracticeImportResponse.builder()
                    .messageId(message.getId())
                    .practiceType(message.getPracticeType())
                    .targetMode(request.getTargetMode())
                    .targetType(result.targetType())
                    .targetId(result.targetId())
                    .createdQuizId(result.createdQuizId())
                    .createdDeckId(null)
                    .createdQuestions(result.createdQuestions())
                    .createdOptions(result.createdOptions())
                    .createdCards(0)
                    .skippedDuplicates(result.skippedDuplicates())
                    .practiceStatus(message.getPracticeStatus())
                    .importedAt(importedAt)
                    .build();
        }

        FlashcardGeneratedPayload payload = aiPracticePayloadValidator.parseFlashcardPayload(message.getGeneratedPayload());
        FlashcardAiImportService.ImportResult result = flashcardAiImportService.importFromChatDraft(message.getSession(),
                payload, request);
        message.setPracticeStatus(PracticeStatus.IMPORTED);
        message.setImportedTargetType(result.targetType());
        message.setImportedTargetId(result.targetId());
        message.setImportedAt(importedAt);
        chatMessageRepository.save(message);

        return PracticeImportResponse.builder()
                .messageId(message.getId())
                .practiceType(message.getPracticeType())
                .targetMode(request.getTargetMode())
                .targetType(result.targetType())
                .targetId(result.targetId())
                .createdQuizId(null)
                .createdDeckId(result.createdDeckId())
                .createdQuestions(0)
                .createdOptions(0)
                .createdCards(result.createdCards())
                .skippedDuplicates(result.skippedDuplicates())
                .practiceStatus(message.getPracticeStatus())
                .importedAt(importedAt)
                .build();
    }

    private void validateImportableDraft(ChatMessage message) {
        if (message.getMessageType() != ChatMessageType.QUIZ_DRAFT
                && message.getMessageType() != ChatMessageType.FLASHCARD_DRAFT) {
            throw new AppException(ErrorCode.CHAT_MESSAGE_NOT_PRACTICE_DRAFT);
        }
        if (message.getPracticeStatus() == PracticeStatus.IMPORTED) {
            throw new AppException(ErrorCode.PRACTICE_DRAFT_ALREADY_IMPORTED);
        }
        if (message.getPracticeStatus() != PracticeStatus.READY || message.getGeneratedPayload() == null) {
            throw new AppException(ErrorCode.PRACTICE_DRAFT_NOT_READY);
        }
    }
}
