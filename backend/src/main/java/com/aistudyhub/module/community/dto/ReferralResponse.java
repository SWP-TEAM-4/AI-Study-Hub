package com.aistudyhub.module.community.dto;

import com.aistudyhub.common.enums.ReferralStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReferralResponse {

    private Long id;
    private String code;
    private Long appliedByUserId;
    private ReferralStatus status;
    private Integer rewardPoints;
}
