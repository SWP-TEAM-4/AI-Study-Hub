package com.aistudyhub.module.reputation.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReviewNominationRequest {
    private String reviewNote;
    private LocalDateTime effectiveStartAt;
    private LocalDateTime effectiveEndAt;
}
