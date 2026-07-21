package com.aistudyhub.repository.projection;

public interface ReputationLeaderboardProjection {
    Long getUserId();
    String getFullName();
    String getAvatarUrl();
    Long getScore();
    Long getEventCount();
}
