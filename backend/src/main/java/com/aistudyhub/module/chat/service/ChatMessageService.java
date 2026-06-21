package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.module.chat.dto.ChatMessageCitationResponse;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.service.DocumentChunkService;
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
    private static final int MAX_EXCERPT_LENGTH = 180;
    private static final int MAX_SUMMARY_CHUNKS = 3;
    private static final TypeReference<List<ChatMessageCitationResponse>> CITATION_LIST_TYPE = new TypeReference<>() {
    };

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentChunkService documentChunkService;
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

        List<DocumentChunkResponse> relevantChunks = documentChunkService.findRelevantChunks(
                session.getNotebook().getId(),
                userId,
                normalizedQuestion,
                topK
        );
        List<ChatMessageCitationResponse> citations = buildCitedSources(relevantChunks);
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

    private List<ChatMessageCitationResponse> buildCitedSources(List<DocumentChunkResponse> relevantChunks) {
        return relevantChunks.stream()
                .map(chunk -> ChatMessageCitationResponse.builder()
                        .documentId(chunk.getDocumentId())
                        .documentTitle(chunk.getDocumentTitle())
                        .chunkIndex(chunk.getChunkIndex())
                        .sourcePage(chunk.getSourcePage())
                        .excerpt(buildExcerpt(chunk.getTextContent()))
                .build())
                .toList();
    }

    private String buildAnswerWithFallback(String question, List<DocumentChunkResponse> relevantChunks,
                                           List<ChatMessageCitationResponse> citations) {
        if (citations.isEmpty()) {
            return buildMockAnswer(question, citations);
        }

        try {
            return openAIChatAnswerService.generateAnswer(question, relevantChunks);
        } catch (AppException ex) {
            log.warn("Falling back to local answer for question '{}' because OpenAI call failed: {}",
                    question, ex.getMessage());
            return buildMockAnswer(question, citations);
        }
    }

    private String buildMockAnswer(String question, List<ChatMessageCitationResponse> citations) {
        if (citations.isEmpty()) {
            return "Mình chưa tìm thấy đoạn tài liệu phù hợp trong notebook hiện tại để trả lời câu hỏi \""
                    + question
                    + "\". Bạn có thể thử hỏi cụ thể hơn hoặc bổ sung thêm tài liệu liên quan.";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Dựa trên tài liệu trong notebook, đây là phần tóm tắt cho câu hỏi \"")
                .append(question)
                .append("\":");

        citations.stream()
                .limit(MAX_SUMMARY_CHUNKS)
                .forEach(citation -> builder.append("\n- ")
                        .append(citation.getExcerpt()));

        builder.append("\nCác ý trên được tổng hợp từ ")
                .append(citations.stream()
                        .map(ChatMessageCitationResponse::getDocumentTitle)
                        .distinct()
                        .limit(MAX_SUMMARY_CHUNKS)
                        .reduce((left, right) -> left + ", " + right)
                        .orElse("tài liệu trong notebook"))
                .append(".");

        return builder.toString();
    }

    private String buildExcerpt(String textContent) {
        if (textContent == null || textContent.isBlank()) {
            return "";
        }

        String normalized = textContent.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= MAX_EXCERPT_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, MAX_EXCERPT_LENGTH - 3).trim() + "...";
    }

    private String toCitationJson(List<ChatMessageCitationResponse> citations) {
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (JsonProcessingException ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Failed to serialize cited sources");
        }
    }

    private List<ChatMessageCitationResponse> parseCitations(String citedSources) {
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
