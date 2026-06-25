package com.aistudyhub.module.admin.dto;

import java.time.LocalDateTime;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminContentResponse {
    private Long id;

    private String targetType;

    private String title;

    private Long ownerId;

    private String ownerName;

    private Long subjectId;

    private String subjectName;

    private Visibility visibility;

    private MarketStatus marketStatus;

    private LocalDateTime createdAt;
}
