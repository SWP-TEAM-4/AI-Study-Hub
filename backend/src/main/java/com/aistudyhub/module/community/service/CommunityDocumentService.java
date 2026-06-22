package com.aistudyhub.module.community.service;

import java.util.List;

import org.springframework.data.domain.Page;
import com.aistudyhub.module.community.dto.CommunityDocumentResponse;

public interface CommunityDocumentService {
    Page<CommunityDocumentResponse> getDocuments(String keyword,
            Long subjectId,
            Long semesterId,
            Long tagId,
            String fileType,
            String sort,
            int page,
            int size);

    CommunityDocumentResponse getDocument(Long id);

    List<CommunityDocumentResponse> getTopDocuments();
}
