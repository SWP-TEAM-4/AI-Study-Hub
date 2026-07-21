package com.aistudyhub.module.reputation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RewardRuleRequest {
    @NotNull
    private Integer pointsDelta;
    private Boolean enabled;
    private Integer maxEventsPerUserPerPeriod;
    private Integer thresholdValue;
    private Integer minRating;
    private Integer maxRating;
    private String description;
}
