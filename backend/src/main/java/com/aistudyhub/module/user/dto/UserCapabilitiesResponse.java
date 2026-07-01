package com.aistudyhub.module.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class UserCapabilitiesResponse {
    private boolean admin;
    private boolean canReviewMarketplace;
    private boolean canModerateReports;
}
