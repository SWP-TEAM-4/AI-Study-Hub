package com.aistudyhub.module.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatMessageCitationResponse {

    private Long documentId;
    private String documentTitle;
    private Integer chunkIndex;
    private Integer sourcePage;
    private String excerpt;
}
