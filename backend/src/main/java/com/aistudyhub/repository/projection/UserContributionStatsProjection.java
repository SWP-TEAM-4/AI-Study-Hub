package com.aistudyhub.repository.projection;

import java.math.BigDecimal;

public interface UserContributionStatsProjection {

    Long getUserId();

    Long getApprovedContents();

    Long getTotalDownloads();

    Long getTotalReviewCount();

    BigDecimal getTotalAcceptPercentage();
}
