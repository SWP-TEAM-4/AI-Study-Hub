package com.aistudyhub.repository.projection;

public interface UserTopSubjectProjection {
    Long getSubjectId();
    String getSubjectCode();
    String getSubjectName();
    Long getScore();
    Long getEventCount();
}
