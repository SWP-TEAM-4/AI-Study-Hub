package com.aistudyhub.module.chat.dto;

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
    private String content;
    private List<ChatMessageCitationResponse> citedSources;
    private LocalDateTime createdAt;
}
