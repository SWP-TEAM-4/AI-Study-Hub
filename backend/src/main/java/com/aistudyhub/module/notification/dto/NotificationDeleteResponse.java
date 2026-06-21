package com.aistudyhub.module.notification.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationDeleteResponse {

    private boolean deleted;
}
