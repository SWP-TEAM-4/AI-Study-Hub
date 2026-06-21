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
import com.aistudyhub.module.document.dto.UpdateDocumentRequest;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public DocumentResponse createDocument(Long userId, CreateDocumentRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
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
        return DocumentResponse.builder()
                .id(document.getId())
                .subjectId(
                        document.getSubject() != null
                                ? document.getSubject().getId()
                                : null)
                .title(document.getTitle())
                .description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .cloudFilePath(document.getCloudFilePath())
                .filetype(document.getFileType())
                .fileSize(document.getFileSize())
                .visibility(document.getVisibility())
                .marketStatus(document.getMarketStatus())
                .downloadCount(document.getDownloadCount())
                .reviewCount(document.getReviewCount())
                .acceptPercentage(document.getAcceptPercentage())
                .aiVerdictNote(document.getAiVerdictNote())
                .processingStatus(document.getProcessingStatus())
                .build();
    }

    @Override
    public List<DocumentResponse> getMyDocument(Long userId, String keyword, Long subjectId, String fileType,
            Visibility visibility, ProcessingStatus processingStatus) {
        return documentRepository.searchDocuments(userId, keyword, subjectId, fileType, visibility, processingStatus)
                .stream()
                .map(document -> DocumentResponse.builder()
                        .id(document.getId())
                        .subjectId(
                                document.getSubject() != null
                                        ? document.getSubject().getId()
                                        : null)
                        .title(document.getTitle())
                        .description(document.getDescription())
                        .fileUrl(document.getFileUrl())
                        .cloudFilePath(document.getCloudFilePath())
                        .filetype(document.getFileType())
                        .fileSize(document.getFileSize())
                        .visibility(document.getVisibility())
                        .marketStatus(document.getMarketStatus())
                        .downloadCount(document.getDownloadCount())
                        .reviewCount(document.getReviewCount())
                        .acceptPercentage(document.getAcceptPercentage())
                        .aiVerdictNote(document.getAiVerdictNote())
                        .processingStatus(document.getProcessingStatus())
                        .build())
                .toList();
    }

    @Override
    public DocumentResponse getDocumentDetails(Long id, Long userId) {
        Document document = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED));
        return DocumentResponse.builder()
                .id(document.getId())
                .subjectId(
                        document.getSubject() != null
                                ? document.getSubject().getId()
                                : null)
                .title(document.getTitle())
                .description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .cloudFilePath(document.getCloudFilePath())
                .filetype(document.getFileType())
                .fileSize(document.getFileSize())
                .visibility(document.getVisibility())
                .marketStatus(document.getMarketStatus())
                .downloadCount(document.getDownloadCount())
                .reviewCount(document.getReviewCount())
                .acceptPercentage(document.getAcceptPercentage())
                .aiVerdictNote(document.getAiVerdictNote())
                .processingStatus(document.getProcessingStatus())
                .build();
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
        return DocumentResponse.builder()
                .id(document.getId())
                .subjectId(
                        document.getSubject() != null
                                ? document.getSubject().getId()
                                : null)
                .title(document.getTitle())
                .description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .cloudFilePath(document.getCloudFilePath())
                .filetype(document.getFileType())
                .fileSize(document.getFileSize())
                .visibility(document.getVisibility())
                .marketStatus(document.getMarketStatus())
                .downloadCount(document.getDownloadCount())
                .reviewCount(document.getReviewCount())
                .acceptPercentage(document.getAcceptPercentage())
                .aiVerdictNote(document.getAiVerdictNote())
                .processingStatus(document.getProcessingStatus())
                .build();
    }

    @Override
    public void deleteDocument(Long id, Long userId) {
        Document document = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED));
        documentRepository.delete(document);
    }

}
