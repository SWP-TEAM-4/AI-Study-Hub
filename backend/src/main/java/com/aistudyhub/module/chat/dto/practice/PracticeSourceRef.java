package com.aistudyhub.module.chat.dto.practice;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSourceRef {
    private Long documentId;
    private Integer chunkIndex;
    private Integer sourcePage;
    private String excerpt;
}
