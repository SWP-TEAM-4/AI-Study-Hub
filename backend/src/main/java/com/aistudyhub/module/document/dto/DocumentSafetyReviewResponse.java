package com.aistudyhub.module.document.dto;

import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentSafetyReviewEventType;
import com.aistudyhub.common.enums.DocumentSafetyReviewStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class DocumentSafetyReviewResponse {

    private Long id;
    private Long documentId;
    private String documentTitle;
    private Long ownerUserId;
    private String ownerName;
    private Long triggeredByUserId;
    private Long reviewerUserId;
    private DocumentSafetyReviewEventType eventType;
    private DocumentSafetyReviewStatus reviewStatus;
    private DocumentModerationStatus documentModerationStatus;
    private DocumentViolationSeverity violationSeverity;
    private String category;
    private Double confidence;
    private List<String> policyFlags;
    private String reason;
    private String moderationNote;
    private String textExcerpt;
    private String reviewedNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
