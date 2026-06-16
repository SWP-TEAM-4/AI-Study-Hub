package com.aistudyhub.module.document.service;

import java.util.List;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.module.document.dto.CreateDocumentRequest;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentRequest;

public interface DocumentService {
    DocumentResponse createDocument(Long userId, CreateDocumentRequest request);

    List<DocumentResponse> getMyDocument(Long userId,
            String keyword,
            Long subjectId,
            String fileType,
            Visibility visibility,
            ProcessingStatus processingStatus);

    DocumentResponse getDocumentDetails(Long id, Long userId);

    DocumentResponse updateDocument(Long id, Long userId, UpdateDocumentRequest request);

    void deleteDocument(Long id, Long userId);
}
