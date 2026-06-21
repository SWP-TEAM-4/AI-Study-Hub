package com.aistudyhub.module.chat.dto;

import com.aistudyhub.module.rag.dto.CitedSourceResponse;
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
    private List<CitedSourceResponse> citedSources;
    private LocalDateTime createdAt;
}
