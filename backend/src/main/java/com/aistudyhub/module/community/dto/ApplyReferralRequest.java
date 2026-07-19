package com.aistudyhub.module.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplyReferralRequest {

    @NotBlank(message = "Referral code is required")
    @Size(max = 50, message = "Referral code must be at most 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Referral code format is invalid")
    private String referralCode;
}
