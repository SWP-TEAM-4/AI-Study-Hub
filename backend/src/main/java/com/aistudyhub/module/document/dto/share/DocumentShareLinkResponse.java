package com.aistudyhub.module.document.dto.share;

import com.aistudyhub.common.enums.Visibility;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DocumentShareLinkResponse {

    private Long id;
    private Long documentId;
    private Long ownerUserId;
    private String shareToken;
    private String shareUrl;
    private String downloadUrl;
    @JsonProperty("isEnabled")
    private boolean isEnabled;
    private boolean allowPreview;
    private boolean allowDownload;
    private LocalDateTime expiresAt;
    private Integer accessCount;
    private LocalDateTime lastAccessedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Visibility documentVisibility;
}
