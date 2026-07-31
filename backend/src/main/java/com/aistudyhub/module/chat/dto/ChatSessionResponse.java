package com.aistudyhub.module.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatSessionResponse {

    private Long id;
    private Long notebookId;
    private Long userId;
    private String title;
    private Boolean isPrivate;
    private Boolean adminAccessAllowed;
    private Boolean reportedToAdmin;
    private String adminReportReason;
    private LocalDateTime adminReportedAt;
    private LocalDateTime createdAt;
}
