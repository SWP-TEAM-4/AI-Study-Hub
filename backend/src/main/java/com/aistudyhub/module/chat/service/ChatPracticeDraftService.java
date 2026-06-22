package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.ChatMessageType;
import com.aistudyhub.common.enums.PracticeStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.chat.dto.ChatMessageCitationResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.service.DocumentChunkService;
import com.aistudyhub.repository.ChatMessageRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatPracticeDraftService {

    private static final int DEFAULT_TOP_K = 8;

    private final ChatAccessService chatAccessService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageMapper chatMessageMapper;
    private final DocumentChunkService documentChunkService;
    private final AiPracticePromptBuilder aiPracticePromptBuilder;
    private final AiJsonGenerationClient aiJsonGenerationClient;
    private final AiPracticePayloadValidator aiPracticePayloadValidator;
    private final ObjectMapper objectMapper;
    private final ActivityLogService activityLogService;

    @Transactional
    public SendChatMessageResponse sendPracticeDraft(Long sessionId, Long userId, CreateChatMessageRequest request,
                                                     PracticePromptParser.ParsedPracticePrompt parsedPrompt) {
        ChatSession session = chatAccessService.resolveOwnedSession(sessionId, userId);
        int topK = request.getTopK() == null ? DEFAULT_TOP_K : request.getTopK();

        List<DocumentChunkResponse> relevantChunks = documentChunkService.findRelevantChunks(
                session.getNotebook().getId(),
                userId,
                request.getDocumentIds(),
                parsedPrompt.promptWithoutPrefix(),
                topK
        );
        List<ChatMessageCitationResponse> citations = chatMessageMapper.buildCitedSources(relevantChunks);

        int nextSequence = chatMessageRepository.findMaxMessageSequenceBySessionId(sessionId).orElse(0) + 1;
        ChatMessage userMessage = chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .messageSequence(nextSequence)
                .senderRole("USER")
                .messageType(ChatMessageType.TEXT)
                .content(parsedPrompt.normalizedContent())
                .citedSources("[]")
                .practiceStatus(PracticeStatus.NONE)
                .build());

        ChatMessage aiMessage;
        if (relevantChunks.isEmpty()) {
            aiMessage = saveFailedDraft(session, nextSequence + 1, parsedPrompt.practiceType(), citations,
                    buildFailureSummary(parsedPrompt.practiceType()),
                    singleError("relevantChunks", "No relevant document chunks were found for this practice request"));
            return buildSendResponse(userMessage, aiMessage);
        }

        AiPracticeGenerationRequest generationRequest = new AiPracticeGenerationRequest(
                parsedPrompt.practiceType(),
                parsedPrompt.promptWithoutPrefix(),
                request.getLanguage(),
                request.getOptions(),
                relevantChunks
        );

        try {
            AiPracticePrompt prompt = aiPracticePromptBuilder.build(generationRequest);
            String rawJson = aiJsonGenerationClient.generate(generationRequest, prompt);
            AiPracticePayloadValidator.ValidatedPracticePayload validatedPayload =
                    validateWithRepair(parsedPrompt.practiceType(), rawJson, generationRequest, prompt);

            aiMessage = chatMessageRepository.save(ChatMessage.builder()
                    .session(session)
                    .messageSequence(nextSequence + 1)
                    .senderRole("AI")
                    .messageType(resolveDraftMessageType(parsedPrompt.practiceType()))
                    .practiceType(parsedPrompt.practiceType())
                    .content(buildSuccessSummary(parsedPrompt.practiceType(), validatedPayload.itemCount()))
                    .citedSources(chatMessageMapper.toCitationJson(citations))
                    .generatedPayload(validatedPayload.normalizedPayload())
                    .practiceStatus(PracticeStatus.READY)
                    .build());
        } catch (PracticePayloadValidationException ex) {
            aiMessage = saveFailedDraft(session, nextSequence + 1, parsedPrompt.practiceType(), citations,
                    buildFailureSummary(parsedPrompt.practiceType()), ex.getValidationErrors());
        } catch (AppException ex) {
            aiMessage = saveFailedDraft(session, nextSequence + 1, parsedPrompt.practiceType(), citations,
                    buildFailureSummary(parsedPrompt.practiceType()),
                    singleError("generation", ex.getMessage()));
        }

        log.info("Saved AI practice draft for session {} with type {} and status {}",
                sessionId, parsedPrompt.practiceType(), aiMessage.getPracticeStatus());
        logPracticeGeneration(userId, session, parsedPrompt.practiceType(), aiMessage, relevantChunks.size(),
                parsedPrompt.promptWithoutPrefix());
        return buildSendResponse(userMessage, aiMessage);
    }

    @Transactional(readOnly = true)
    public JsonNode previewDraft(Long messageId, Long userId) {
        ChatMessage message = chatAccessService.resolveOwnedMessage(messageId, userId);
        validatePracticeDraftMessage(message);
        if (message.getGeneratedPayload() == null) {
            throw new AppException(com.aistudyhub.common.exception.ErrorCode.PRACTICE_DRAFT_NOT_READY,
                    "Practice draft does not contain generated payload");
        }
        return message.getGeneratedPayload();
    }

    private ChatMessage saveFailedDraft(ChatSession session, int messageSequence, AiPracticeType practiceType,
                                        List<ChatMessageCitationResponse> citations, String summary,
                                        JsonNode validationErrors) {
        return chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .messageSequence(messageSequence)
                .senderRole("AI")
                .messageType(resolveDraftMessageType(practiceType))
                .practiceType(practiceType)
                .content(summary)
                .citedSources(chatMessageMapper.toCitationJson(citations))
                .validationErrors(validationErrors)
                .practiceStatus(PracticeStatus.FAILED)
                .build());
    }

    private SendChatMessageResponse buildSendResponse(ChatMessage userMessage, ChatMessage aiMessage) {
        return SendChatMessageResponse.builder()
                .userMessage(chatMessageMapper.toResponse(userMessage))
                .aiMessage(chatMessageMapper.toResponse(aiMessage))
                .build();
    }

    private void validatePracticeDraftMessage(ChatMessage message) {
        if (message.getMessageType() != ChatMessageType.QUIZ_DRAFT
                && message.getMessageType() != ChatMessageType.FLASHCARD_DRAFT) {
            throw new AppException(com.aistudyhub.common.exception.ErrorCode.CHAT_MESSAGE_NOT_PRACTICE_DRAFT);
        }
    }

    private ChatMessageType resolveDraftMessageType(AiPracticeType practiceType) {
        return practiceType == AiPracticeType.QUIZ ? ChatMessageType.QUIZ_DRAFT : ChatMessageType.FLASHCARD_DRAFT;
    }

    private String buildSuccessSummary(AiPracticeType practiceType, int itemCount) {
        return practiceType == AiPracticeType.QUIZ
                ? "Mình đã tạo quiz draft gồm " + itemCount + " câu từ tài liệu của bạn."
                : "Mình đã tạo flashcard draft gồm " + itemCount + " thẻ từ tài liệu của bạn.";
    }

    private String buildFailureSummary(AiPracticeType practiceType) {
        return practiceType == AiPracticeType.QUIZ
                ? "Mình chưa thể tạo quiz draft hợp lệ từ yêu cầu hiện tại."
                : "Mình chưa thể tạo flashcard draft hợp lệ từ yêu cầu hiện tại.";
    }

    private AiPracticePayloadValidator.ValidatedPracticePayload validateWithRepair(
            AiPracticeType practiceType,
            String rawJson,
            AiPracticeGenerationRequest generationRequest,
            AiPracticePrompt prompt
    ) {
        try {
            return aiPracticePayloadValidator.validate(practiceType, rawJson, generationRequest);
        } catch (PracticePayloadValidationException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_PRACTICE_INVALID_JSON) {
                throw ex;
            }

            log.warn("AI returned malformed JSON for practice type {}. Attempting one repair pass.",
                    practiceType);
            String repairedJson = aiJsonGenerationClient.repairMalformedJson(
                    generationRequest,
                    prompt,
                    rawJson,
                    extractValidationMessage(ex)
            );
            return aiPracticePayloadValidator.validate(practiceType, repairedJson, generationRequest);
        }
    }

    private String extractValidationMessage(PracticePayloadValidationException ex) {
        JsonNode validationErrors = ex.getValidationErrors();
        if (validationErrors != null && validationErrors.isArray() && !validationErrors.isEmpty()) {
            JsonNode firstError = validationErrors.get(0);
            if (firstError != null && firstError.hasNonNull("message")) {
                return firstError.get("message").asText();
            }
        }
        return ex.getMessage();
    }

    private ArrayNode singleError(String field, String message) {
        ArrayNode errors = objectMapper.createArrayNode();
        ObjectNode node = objectMapper.createObjectNode();
        node.put("field", field);
        node.put("message", message);
        errors.add(node);
        return errors;
    }

    private void logPracticeGeneration(Long userId,
                                       ChatSession session,
                                       AiPracticeType practiceType,
                                       ChatMessage aiMessage,
                                       int relevantChunkCount,
                                       String promptText) {
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("sessionId", session.getId());
        metadata.put("messageId", aiMessage.getId());
        metadata.put("practiceType", practiceType.name());
        metadata.put("practiceStatus", aiMessage.getPracticeStatus().name());
        metadata.put("relevantChunkCount", relevantChunkCount);
        metadata.put("generatedPayloadReady", aiMessage.getGeneratedPayload() != null);
        metadata.put("validationErrorCount",
                aiMessage.getValidationErrors() != null && aiMessage.getValidationErrors().isArray()
                        ? aiMessage.getValidationErrors().size()
                        : 0);

        ActivityActionType action = practiceType == AiPracticeType.QUIZ
                ? ActivityActionType.GENERATE_QUIZ
                : ActivityActionType.GENERATE_FLASHCARD;

        activityLogService.log(
                userId,
                action,
                ActivityTargetType.CHAT_SESSION,
                session.getId(),
                metadata,
                session.getTitle(),
                summarizeForLog(promptText));
    }

    private String summarizeForLog(String rawText) {
        if (rawText == null) {
            return null;
        }
        String normalized = rawText.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= 120) {
            return normalized;
        }
        return normalized.substring(0, 120) + "...";
    }
}
