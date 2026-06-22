package com.aistudyhub.module.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO for receiving marketplace review requests from the client.
 * Owner: BE3 (Task BE-030)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketReviewRequest {
    @NotBlank(message = "voteResult is required")
    private String voteResult; // "APPROVED", "REJECTED"
    private String reviewNote;
}
