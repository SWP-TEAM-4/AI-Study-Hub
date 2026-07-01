package com.aistudyhub.module.marketplace.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateReviewPolicyRequest {
    @NotBlank
    private String mode;
    @NotNull @Min(1) @Max(99)
    private Integer requiredVotes;
    @NotNull @Min(1) @Max(100)
    private Integer approvalPercentage;
}
