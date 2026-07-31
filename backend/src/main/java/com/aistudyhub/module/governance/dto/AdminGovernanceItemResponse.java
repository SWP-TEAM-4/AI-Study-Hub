package com.aistudyhub.module.governance.dto;

import com.aistudyhub.common.enums.ActivityTargetType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminGovernanceItemResponse {

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
    private Integer itemCount;
    private Boolean adminPreviewAllowed;
    private String accessReason;
    private String reportReason;
    private LocalDateTime reportedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
