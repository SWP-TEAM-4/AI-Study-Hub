package com.aistudyhub.module.reputation.dto;

import com.aistudyhub.common.enums.ReputationEventType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RewardRuleResponse {
    private Long id;
    private ReputationEventType eventType;
    private Integer pointsDelta;
    private Boolean enabled;
    private Integer maxEventsPerUserPerPeriod;
    private Integer thresholdValue;
    private Integer minRating;
    private Integer maxRating;
    private String description;
    private Long updatedByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
