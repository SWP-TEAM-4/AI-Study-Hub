package com.aistudyhub.module.reputation.dto;

import com.aistudyhub.common.enums.ReputationEventType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReputationEventResponse {
    private Long id;
    private Long userId;
    private Long subjectId;
    private ReputationEventType eventType;
    private String targetType;
    private Long targetId;
    private String sourceType;
    private Long sourceId;
    private Integer pointsDelta;
    private String reason;
    private String displayTitle;
    private String displayMessage;
    private String periodKey;
    private LocalDateTime createdAt;
}
