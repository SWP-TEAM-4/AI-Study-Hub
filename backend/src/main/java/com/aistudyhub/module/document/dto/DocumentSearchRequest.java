package com.aistudyhub.module.document.dto;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO cho truy vấn document metadata của current user.
 */
@Getter
@Setter
public class DocumentSearchRequest {

    private String keyword;
    private Long subjectId;
    private String fileType;
    private Visibility visibility;
    private ProcessingStatus processingStatus;
}
