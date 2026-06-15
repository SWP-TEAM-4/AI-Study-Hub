package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.document.dto.DocumentSearchRequest;
import com.aistudyhub.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentQueryService {

    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public Page<DocumentResponse> searchMyDocuments(Long userId, DocumentSearchRequest request, Pageable pageable) {
        Specification<Document> specification = Specification
                .where(hasUserId(userId))
                .and(hasKeyword(request.getKeyword()))
                .and(hasSubjectId(request.getSubjectId()))
                .and(hasFileType(request.getFileType()))
                .and(hasVisibility(request.getVisibility()))
                .and(hasProcessingStatus(request.getProcessingStatus()));

        return documentRepository.findAll(specification, pageable)
                .map(DocumentResponseMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long documentId, Long userId) {
        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });

        return DocumentResponseMapper.toResponse(document);
    }

    private Specification<Document> hasUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    private Specification<Document> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String likeKeyword = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), likeKeyword),
                    cb.like(cb.lower(root.get("description")), likeKeyword));
        };
    }

    private Specification<Document> hasSubjectId(Long subjectId) {
        return (root, query, cb) -> subjectId == null
                ? cb.conjunction()
                : cb.equal(root.get("subject").get("id"), subjectId);
    }

    private Specification<Document> hasFileType(String fileType) {
        return (root, query, cb) -> {
            if (fileType == null || fileType.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get("fileType")), fileType.trim().toLowerCase());
        };
    }

    private Specification<Document> hasVisibility(Visibility visibility) {
        return (root, query, cb) -> visibility == null
                ? cb.conjunction()
                : cb.equal(root.get("visibility"), visibility);
    }

    private Specification<Document> hasProcessingStatus(ProcessingStatus processingStatus) {
        return (root, query, cb) -> processingStatus == null
                ? cb.conjunction()
                : cb.equal(root.get("processingStatus"), processingStatus);
    }
}
