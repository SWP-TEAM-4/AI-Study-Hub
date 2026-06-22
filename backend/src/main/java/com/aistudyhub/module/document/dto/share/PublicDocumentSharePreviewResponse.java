package com.aistudyhub.module.document.dto.share;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PublicDocumentSharePreviewResponse {

    private String title;
    private String description;
    private Long subjectId;
    private String fileType;
    private Long fileSize;
    private boolean allowDownload;
    private String downloadUrl;
    private LocalDateTime expiresAt;
    private String previewText;
    private Integer previewSourcePage;
    private LocalDateTime createdAt;
}
