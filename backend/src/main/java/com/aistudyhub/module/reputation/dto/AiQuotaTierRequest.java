package com.aistudyhub.module.reputation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiQuotaTierRequest {
    @NotBlank
    private String name;
    @NotNull
    @Min(0)
    private Integer minReputationPoints;
    @NotNull
    @Min(0)
    private Integer dailyChatLimit;
    @NotNull
    @Min(0)
    private Integer monthlyChatLimit;
    @NotNull
    @Min(0)
    private Integer dailySummaryLimit;
    @NotNull
    @Min(0)
    private Integer monthlySummaryLimit;
    @NotNull
    @Min(0)
    private Integer dailyGenerationLimit;
    @NotNull
    @Min(0)
    private Integer monthlyGenerationLimit;
    private Boolean enabled;
}
