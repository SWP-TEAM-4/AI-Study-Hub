package com.aistudyhub.module.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageCitationResponse {

    private Long chunkId;
    private Long documentId;
    private String documentTitle;
    private Integer chunkIndex;
    private Integer sourcePage;
    private String excerpt;
}
