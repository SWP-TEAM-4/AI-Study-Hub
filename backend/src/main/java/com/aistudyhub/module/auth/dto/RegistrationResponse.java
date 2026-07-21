package com.aistudyhub.module.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegistrationResponse {

    private String email;
    private boolean verificationRequired;
    private int expireMinutes;
}
