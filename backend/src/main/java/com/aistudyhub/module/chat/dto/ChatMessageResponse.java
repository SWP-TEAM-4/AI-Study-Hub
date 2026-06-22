package com.aistudyhub.module.chat.dto;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.ChatMessageType;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.enums.PracticeStatus;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ChatMessageResponse {

    private Long id;
    private Long sessionId;
    private Integer messageSequence;
    private String senderRole;
    private ChatMessageType messageType;
    private AiPracticeType practiceType;
    private PracticeStatus practiceStatus;
    private String content;
    private List<ChatMessageCitationResponse> citedSources;
    private JsonNode generatedPayload;
    private JsonNode validationErrors;
    private PracticeImportTargetType importedTargetType;
    private Long importedTargetId;
    private LocalDateTime importedAt;
    private LocalDateTime createdAt;
}
