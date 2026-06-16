package com.aistudyhub.module.document.dto;

import java.math.BigDecimal;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentResponse {
    @NotBlank
    private long id;
    private Long subjectId;
    private String title;
    private String description;
    private String fileUrl;
    private String cloudFilePath;
    private String filetype;
    private Long fileSize;
    private Visibility visibility;
    private MarketStatus marketStatus;
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private String aiVerdictNote;
    private ProcessingStatus processingStatus;
}
