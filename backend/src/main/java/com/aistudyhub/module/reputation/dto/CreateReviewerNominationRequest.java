package com.aistudyhub.module.reputation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReviewerNominationRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Long subjectId;

    private String reason;
}
