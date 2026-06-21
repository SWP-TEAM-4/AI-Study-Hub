package com.aistudyhub.module.document.service;

import java.util.List;

import org.springframework.stereotype.Service;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.document.dto.CreateDocumentRequest;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.document.dto.UpdateDocumentRequest;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {
        private final DocumentRepository documentRepository;
        private final UserRepository userRepository;
        private final SubjectRepository subjectRepository;

        @Override
        public DocumentResponse createDocument(Long userId, CreateDocumentRequest request) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                Subject subject = null;
                if (request.getSubjectId() != null) {
                        subject = subjectRepository.findById(request.getSubjectId())
                                        .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
                }
                Document document = Document.builder()
                                .user(user).subject(subject).title(request.getTitle())
                                .description(request.getDescription()).fileUrl(request.getFileUrl())
                                .cloudFilePath(request.getCloudFilePath()).fileType(request.getFileType())
                                .fileSize(request.getFileSize()).build();
                document = documentRepository.save(document);
                return DocumentResponseMapper.toResponse(document);
        }

        @Override
        public List<DocumentResponse> getMyDocument(Long userId, String keyword, Long subjectId, String fileType,
                        Visibility visibility, ProcessingStatus processingStatus) {
                Specification<Document> specification = hasUserId(userId)
                                .and(hasKeyword(keyword))
                                .and(hasSubjectId(subjectId))
                                .and(hasFileType(fileType))
                                .and(hasVisibility(visibility))
                                .and(hasProcessingStatus(processingStatus));

                return documentRepository
                                .findAll(specification)
                                .stream()
                                .map(DocumentResponseMapper::toResponse)
                                .toList();
        }

        @Override
        public DocumentResponse getDocumentDetails(Long id, Long userId) {
                Document document = documentRepository.findByIdAndUserId(id, userId)
                                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED));
                return DocumentResponseMapper.toResponse(document);
        }

        @Override
        public DocumentResponse updateDocument(Long id, Long userId, UpdateDocumentRequest request) {
                Document document = documentRepository.findByIdAndUserId(id, userId)
                                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED));
                Subject subject = null;
                if (request.getSubjectId() != null) {
                        subject = subjectRepository.findById(request.getSubjectId())
                                        .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
                }
                document.setTitle(request.getTitle());
                document.setDescription(request.getDescription());
                document.setSubject(subject);
                if (request.getVisibility() != null) {
                        document.setVisibility(request.getVisibility());
                }
                document = documentRepository.save(document);
                return DocumentResponseMapper.toResponse(document);
        }

        @Override
        public void deleteDocument(Long id, Long userId) {
                Document document = documentRepository.findByIdAndUserId(id, userId)
                                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED));
                documentRepository.delete(document);
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
