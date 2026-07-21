package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.module.chat.dto.ChatMessageCitationResponse;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatMessageMapper {

    private static final int MAX_EXCERPT_LENGTH = 180;
    private static final TypeReference<List<ChatMessageCitationResponse>> CITATION_LIST_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public List<ChatMessageCitationResponse> buildCitedSources(List<DocumentChunkResponse> relevantChunks) {
        return relevantChunks.stream()
                .map(chunk -> ChatMessageCitationResponse.builder()
                        .chunkId(chunk.getId())
                        .documentId(chunk.getDocumentId())
                        .documentTitle(chunk.getDocumentTitle())
                        .chunkIndex(chunk.getChunkIndex())
                        .sourcePage(chunk.getSourcePage())
                        .excerpt(buildExcerpt(chunk.getTextContent()))
                        .build())
                .toList();
    }

    public String toCitationJson(List<ChatMessageCitationResponse> citations) {
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (JsonProcessingException ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Failed to serialize cited sources");
        }
    }

    public List<ChatMessageCitationResponse> parseCitations(String citedSources) {
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

    public ChatMessageResponse toResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .messageSequence(message.getMessageSequence())
                .senderRole(message.getSenderRole())
                .messageType(message.getMessageType())
                .practiceType(message.getPracticeType())
                .practiceStatus(message.getPracticeStatus())
                .content(message.getContent())
                .citedSources(parseCitations(message.getCitedSources()))
                .generatedPayload(message.getGeneratedPayload())
                .validationErrors(message.getValidationErrors())
                .importedTargetType(message.getImportedTargetType())
                .importedTargetId(message.getImportedTargetId())
                .importedAt(message.getImportedAt())
                .createdAt(message.getCreatedAt())
                .build();
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
}
