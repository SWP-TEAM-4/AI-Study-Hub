package com.aistudyhub.module.community.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.module.tag.dto.TagResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommunityDocumentResponse {
    private Long id;
    private String title;
    private String description;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private Integer downloadCount;
    private Integer reviewCount;
    private BigDecimal acceptPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UploaderInfo uploader;
    private SubjectResponse subject;
    private List<TagResponse> tags;

    @Getter
    @Builder
    public static class UploaderInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;

    }
}
