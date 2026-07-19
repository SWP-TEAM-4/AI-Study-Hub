package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.service.DocumentChunkService;
import com.aistudyhub.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private static final int DEFAULT_TOP_K = 3;
    private static final int MAX_SUMMARY_CHUNKS = 3;
    private static final int MAX_CONTEXT_CHUNKS_FOR_USAGE = 5;

    private final ChatAccessService chatAccessService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageMapper chatMessageMapper;
    private final DocumentChunkService documentChunkService;
    private final OpenAIChatAnswerService openAIChatAnswerService;
    private final PracticePromptParser practicePromptParser;
    private final ChatPracticeDraftService chatPracticeDraftService;
    private final ActivityLogService activityLogService;
    private final AiUsageService aiUsageService;

    @Transactional
    public SendChatMessageResponse sendMessage(Long sessionId, Long userId, CreateChatMessageRequest request) {
        PracticePromptParser.ParsedPracticePrompt parsedPrompt = practicePromptParser.parse(request.getContent());
        if (parsedPrompt.isPractice()) {
            return chatPracticeDraftService.sendPracticeDraft(sessionId, userId, request, parsedPrompt);
        }
        return sendStandardMessage(sessionId, userId, parsedPrompt.normalizedContent(), request);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listMessages(Long sessionId, Long userId) {
        chatAccessService.resolveOwnedSession(sessionId, userId);
        return chatMessageRepository.findBySessionIdOrderByMessageSequenceAsc(sessionId).stream()
                .map(chatMessageMapper::toResponse)
                .toList();
    }

    private SendChatMessageResponse sendStandardMessage(Long sessionId, Long userId, String normalizedQuestion,
                                                        CreateChatMessageRequest request) {
        ChatSession session = chatAccessService.resolveOwnedSession(sessionId, userId);
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
        var citations = chatMessageMapper.buildCitedSources(relevantChunks);
        String aiAnswer = buildAnswerWithFallback(normalizedQuestion, relevantChunks, citations);

        ChatMessage aiMessage = chatMessageRepository.save(ChatMessage.builder()
                .session(session)
                .messageSequence(nextSequence + 1)
                .senderRole("AI")
                .content(aiAnswer)
                .citedSources(chatMessageMapper.toCitationJson(citations))
                .build());

        log.info("Saved chat turn for session {} with user sequence {} and ai sequence {}",
                sessionId, userMessage.getMessageSequence(), aiMessage.getMessageSequence());

        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("sessionId", sessionId);
        metadata.put("userMessageId", userMessage.getId());
        metadata.put("aiMessageId", aiMessage.getId());
        metadata.put("topK", topK);
        metadata.put("citationCount", citations.size());
        metadata.put("questionPreview", summarizeForLog(normalizedQuestion));
        AiActionType aiActionType = resolveStandardActionType(normalizedQuestion);
        int estimatedTokens = estimateTokenCount(normalizedQuestion, relevantChunks, aiAnswer);
        metadata.put("aiUsageActionType", aiActionType.name());
        metadata.put("estimatedTokens", estimatedTokens);
        activityLogService.log(
                userId,
                ActivityActionType.CHAT_AI,
                ActivityTargetType.CHAT_SESSION,
                sessionId,
                metadata,
                session.getTitle(),
                summarizeForLog(normalizedQuestion));
        safeLogAiUsage(userId, aiActionType, estimatedTokens);

        return SendChatMessageResponse.builder()
                .userMessage(chatMessageMapper.toResponse(userMessage))
                .aiMessage(chatMessageMapper.toResponse(aiMessage))
                .build();
    }

    private String buildAnswerWithFallback(String question, List<DocumentChunkResponse> relevantChunks,
                                           List<com.aistudyhub.module.chat.dto.ChatMessageCitationResponse> citations) {
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

    private String buildMockAnswer(String question, List<com.aistudyhub.module.chat.dto.ChatMessageCitationResponse> citations) {
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
                        .map(com.aistudyhub.module.chat.dto.ChatMessageCitationResponse::getDocumentTitle)
                        .distinct()
                        .limit(MAX_SUMMARY_CHUNKS)
                        .reduce((left, right) -> left + ", " + right)
                        .orElse("tài liệu trong notebook"))
                .append(".");

        return builder.toString();
    }

    private AiActionType resolveStandardActionType(String normalizedQuestion) {
        String asciiLower = toAsciiLower(normalizedQuestion);
        if (containsAny(asciiLower, "tom tat", "summary", "summarize", "summarise")) {
            return AiActionType.SUMMARY;
        }
        if (containsAny(asciiLower, "flashcard", "the ghi nho")
                && containsAny(asciiLower, "tao", "sinh", "generate", "lap")) {
            return AiActionType.FLASHCARD_GENERATION;
        }
        if (containsAny(asciiLower, "quiz", "trac nghiem")
                && containsAny(asciiLower, "tao", "sinh", "generate", "lap")) {
            return AiActionType.QUIZ_GENERATION;
        }
        return AiActionType.CHAT;
    }

    private String toAsciiLower(String rawText) {
        if (rawText == null) {
            return "";
        }
        String withoutAccents = Normalizer.normalize(rawText, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private int estimateTokenCount(String question, List<DocumentChunkResponse> relevantChunks, String aiAnswer) {
        long promptTokens = estimateTextTokens(question);
        long contextTokens = relevantChunks.stream()
                .limit(MAX_CONTEXT_CHUNKS_FOR_USAGE)
                .mapToLong(chunk -> chunk.getTokenEstimate() == null
                        ? estimateTextTokens(chunk.getTextContent())
                        : Math.max(chunk.getTokenEstimate(), 0))
                .sum();
        long answerTokens = estimateTextTokens(aiAnswer);
        return capToInteger(promptTokens + contextTokens + answerTokens);
    }

    private long estimateTextTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0L;
        }
        return Math.max(1L, (long) Math.ceil(text.trim().length() / 4.0));
    }

    private int capToInteger(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) Math.max(value, 0L);
    }

    private void safeLogAiUsage(Long userId, AiActionType actionType, Integer tokenCount) {
        try {
            aiUsageService.logUsage(userId, actionType, tokenCount);
        } catch (Exception ex) {
            log.warn("Failed to persist AI usage log for userId={} actionType={}: {}",
                    userId, actionType, ex.getMessage());
        }
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
