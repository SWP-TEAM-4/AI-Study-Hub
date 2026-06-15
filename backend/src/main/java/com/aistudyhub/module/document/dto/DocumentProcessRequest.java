package com.aistudyhub.module.document.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO cho process document thành chunks.
 * Cho phép override chunking config ở mức request để frontend demo linh hoạt hơn.
 */
@Getter
@Setter
public class DocumentProcessRequest {

    private Integer chunkSize;
    private Integer overlap;
    private String mockText;
}
