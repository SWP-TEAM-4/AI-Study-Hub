package com.aistudyhub.module.admin.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.module.admin.dto.AdminContentResponse;
import com.aistudyhub.repository.DocumentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminContentServiceImpl implements AdminContentService {
        private final DocumentRepository documentRepository;

        @Override
        @Transactional(readOnly = true)
        public List<AdminContentResponse> getContents(Long ownerId, Long subjectId, Visibility visibility,
                        MarketStatus marketStatus) {
                return documentRepository.findAll()
                                .stream()
                                .filter(d -> ownerId == null
                                                || d.getUser().getId().equals(ownerId))
                                .filter(d -> subjectId == null
                                                || (d.getSubject() != null
                                                                && d.getSubject().getId().equals(subjectId)))
                                .filter(d -> visibility == null
                                                || d.getVisibility() == visibility)
                                .filter(d -> marketStatus == null
                                                || d.getMarketStatus() == marketStatus)
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        public AdminContentResponse getContent(String targetType, Long targetId) {
                if ("document".equalsIgnoreCase(targetType)) {

                        Document document = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new RuntimeException("Document not found"));

                        return mapToResponse(document);
                }

                throw new RuntimeException("Unsupported target type");
        }

        @Override
        public AdminContentResponse updateVisibility(String targetType, Long targetId, Visibility visibility) {
                if ("document".equalsIgnoreCase(targetType)) {

                        Document document = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

                        document.setVisibility(visibility);

                        Document saved = documentRepository.save(document);

                        return mapToResponse(saved);
                }

                throw new RuntimeException("Unsupported target type");
        }

        @Override
        public void updateMarketStatus(String targetType, Long targetId, MarketStatus marketStatus) {
                if ("document".equalsIgnoreCase(targetType)) {

                        Document document = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

                        document.setMarketStatus(marketStatus);

                        documentRepository.save(document);

                        return;
                }

                throw new RuntimeException("Unsupported target type");
        }

        @Override
        public void deleteContent(String targetType, Long targetId) {
                if ("document".equalsIgnoreCase(targetType)) {

                        Document document = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new RuntimeException("Document not found"));

                        document.setVisibility(Visibility.PRIVATE);

                        document.setMarketStatus(MarketStatus.REJECTED);

                        documentRepository.save(document);

                        return;
                }
        }

        private AdminContentResponse mapToResponse(
                        Document document) {

                return AdminContentResponse.builder()
                                .id(document.getId())
                                .targetType("DOCUMENT")
                                .title(document.getTitle())
                                .ownerId(document.getUser().getId())
                                .ownerName(document.getUser().getFullName())
                                .subjectId(
                                                document.getSubject() != null
                                                                ? document.getSubject().getId()
                                                                : null)
                                .subjectName(
                                                document.getSubject() != null
                                                                ? document.getSubject().getName()
                                                                : null)
                                .visibility(document.getVisibility())
                                .marketStatus(document.getMarketStatus())
                                .createdAt(document.getCreatedAt())
                                .build();
        }
}
