package com.aistudyhub.module.governance.dto;

import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.quiz.dto.QuestionResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminGovernancePreviewResponse {

    private ActivityTargetType targetType;
    private Long targetId;
    private String title;
    private String description;
    private String examType;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Long notebookId;
    private String notebookTitle;
    private String visibility;
    private String marketStatus;
    private String processingStatus;
    private String moderationStatus;
    private String violationSeverity;
    private String fileType;
    private Long fileSize;
    private Boolean aiGenerated;
    private Boolean adminPreviewAllowed;
    private String accessReason;
    private String reportReason;
    private LocalDateTime reportedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentChunkResponse> chunks;
    private List<QuestionResponse> questions;
    private List<FlashcardResponse> cards;
    private List<ChatMessageResponse> messages;
}
