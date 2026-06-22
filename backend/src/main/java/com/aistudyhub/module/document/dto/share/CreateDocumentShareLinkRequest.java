package com.aistudyhub.module.document.dto.share;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateDocumentShareLinkRequest {

    private Boolean allowPreview;

    private Boolean allowDownload;

    private LocalDateTime expiresAt;
}
