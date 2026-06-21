package com.aistudyhub.module.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSystemFeedbackStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String adminNote;
}
