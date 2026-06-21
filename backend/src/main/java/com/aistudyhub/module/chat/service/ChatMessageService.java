package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.rag.dto.CitedSourceResponse;
import com.aistudyhub.module.rag.dto.RelevantChunkResponse;
import com.aistudyhub.module.rag.service.RagCoreService;
import com.aistudyhub.repository.ChatMessageRepository;
import com.aistudyhub.repository.ChatSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private static final int DEFAULT_TOP_K = 3;
    private static final TypeReference<List<CitedSourceResponse>> CITATION_LIST_TYPE = new TypeReference<>() {
    };

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RagCoreService ragCoreService;
    private final OpenAIChatAnswerService openAIChatAnswerService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SendChatMessageResponse sendMessage(Long sessionId, Long userId, CreateChatMessageRequest request) {
        ChatSession session = resolveOwnedSession(sessionId, userId);
        String normalizedQuestion = request.getContent().trim();
        int topK = request.getTopK() == null ? DEFAULT_TOP_K : request.getTopK();
        int nextSequence = chatMessageRepository.findMaxMessageSequenceBySessionId(sessionId).orElse(0) + 1;

        ChatMessage userMessage = chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .messageSequence(nextSequence)
                .senderRole("USER")
                .content(normalizedQuestion)
                .citedSources("[]")
                .build());

        List<RelevantChunkResponse> relevantChunks = ragCoreService.findRelevantChunks(
                session.getNotebook().getId(),
                normalizedQuestion,
                topK,
                userId);
        List<CitedSourceResponse> citations = ragCoreService.buildCitedSources(relevantChunks);
        String aiAnswer = buildAnswerWithFallback(normalizedQuestion, relevantChunks, citations);

        ChatMessage aiMessage = chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .messageSequence(nextSequence + 1)
                .senderRole("AI")
                .content(aiAnswer)
                .citedSources(toCitationJson(citations))
                .build());

        log.info("Saved chat turn for session {} with user sequence {} and ai sequence {}",
                sessionId, userMessage.getMessageSequence(), aiMessage.getMessageSequence());

        return SendChatMessageResponse.builder()
                .userMessage(toResponse(userMessage))
                .aiMessage(toResponse(aiMessage))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listMessages(Long sessionId, Long userId) {
        resolveOwnedSession(sessionId, userId);
        return chatMessageRepository.findBySessionIdOrderByMessageSequenceAsc(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ChatSession resolveOwnedSession(Long sessionId, Long userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> {
                    if (chatSessionRepository.existsById(sessionId)) {
                        return new AppException(ErrorCode.CHAT_SESSION_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND);
                });
    }

    private String buildAnswerWithFallback(String question, List<RelevantChunkResponse> relevantChunks,
                                           List<CitedSourceResponse> citations) {
        if (citations.isEmpty()) {
            return ragCoreService.buildMockAnswer(question, relevantChunks);
        }

        try {
            return openAIChatAnswerService.generateAnswer(question, relevantChunks);
        } catch (AppException ex) {
            log.warn("Falling back to local answer for question '{}' because OpenAI call failed: {}",
                    question, ex.getMessage());
            return ragCoreService.buildMockAnswer(question, relevantChunks);
        }
    }

    private String toCitationJson(List<CitedSourceResponse> citations) {
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (JsonProcessingException ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Failed to serialize cited sources");
        }
    }

    private List<CitedSourceResponse> parseCitations(String citedSources) {
        if (citedSources == null || citedSources.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(citedSources, CITATION_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to parse citedSources JSON for chat message", ex);
            return List.of();
        }
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .messageSequence(message.getMessageSequence())
                .senderRole(message.getSenderRole())
                .content(message.getContent())
                .citedSources(parseCitations(message.getCitedSources()))
                .createdAt(message.getCreatedAt())
                .build();
    }
}
