package com.aistudyhub.module.document.dto.share;

import com.aistudyhub.common.enums.Visibility;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentShareLinkDeleteResponse {

    private boolean deleted;
    private Visibility documentVisibility;
}
