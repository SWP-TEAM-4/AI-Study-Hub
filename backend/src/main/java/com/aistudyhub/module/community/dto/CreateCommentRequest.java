package com.aistudyhub.module.community.dto;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private Long documentId;

    private Long parentCommentId;

    private String content;
}
