package com.aistudyhub.module.document.dto.share;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateDocumentShareLinkRequest {

    private Boolean isEnabled;

    private Boolean allowPreview;

    private Boolean allowDownload;

    private LocalDateTime expiresAt;
}
