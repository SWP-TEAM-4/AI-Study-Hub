package com.aistudyhub.module.feedback.dto;

import com.aistudyhub.common.enums.SystemFeedbackStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SystemFeedbackResponse {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String screenUrl;
    private SystemFeedbackStatus status;
    private LocalDateTime createdAt;
}
