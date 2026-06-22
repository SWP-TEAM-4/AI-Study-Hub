package com.aistudyhub.module.activitylog.dto;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ActivityLogResponse {

    private Long id;
    private Long actorId;
    private ActivityActionType action;
    private ActivityTargetType targetType;
    private Long targetId;
    private JsonNode metadata;
    private LocalDateTime createdAt;
}
