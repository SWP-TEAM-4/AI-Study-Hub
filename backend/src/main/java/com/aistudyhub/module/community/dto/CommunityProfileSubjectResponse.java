package com.aistudyhub.module.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommunityProfileSubjectResponse {
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Long score;
    private Long eventCount;
}
