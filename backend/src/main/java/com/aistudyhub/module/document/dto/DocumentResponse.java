package com.aistudyhub.module.document.dto;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO trả về thông tin document sau khi tạo/upload.
 * Dùng chung cho BE-012 (metadata) và BE-013 (upload).
 */
@Getter
@Builder
public class DocumentResponse {

    private Long id;
    private Long userId;
    private Long subjectId;
    private String title;
    private String description;
    private String fileUrl;
    private String cloudFilePath;
    private String fileType;
    private Long fileSize;
    private Visibility visibility;
    private MarketStatus marketStatus;
    private ProcessingStatus processingStatus;
    private DocumentModerationStatus moderationStatus;
    private DocumentViolationSeverity violationSeverity;
    private String moderationNote;
    private LocalDateTime moderatedAt;
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private Integer communityReviewCount;
    private BigDecimal communityRatingAvg;
    private String aiVerdictNote;
    private Long clonedFromId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
