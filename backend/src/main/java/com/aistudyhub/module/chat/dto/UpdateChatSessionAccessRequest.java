package com.aistudyhub.module.chat.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateChatSessionAccessRequest {

    private Boolean isPrivate;

    private Boolean adminAccessAllowed;

    @Size(max = 1000, message = "adminReportReason must be at most 1000 characters")
    private String adminReportReason;
}
