package com.aistudyhub.module.community.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentTag;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.Tag;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.CommunityDocumentResponse;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.module.tag.dto.TagResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentTagRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunityDocumentServiceImpl implements CommunityDocumentService {
    private final DocumentRepository documentRepository;
    private final DocumentTagRepository documentTagRepository;

    @Override
    public Page<CommunityDocumentResponse> getDocuments(String keyword, Long subjectId, Long semesterId, Long tagId,
            String fileType, String sort, int page, int size) {
        Sort sortObj;
        switch (sort) {
            case "mostDownloaded":
                sortObj = Sort.by("downloadCount").descending();
                break;

            case "highestRated":
                sortObj = Sort.by("acceptPercentage").descending();
                break;

            default:
                sortObj = Sort.by("createdAt").descending();
        }
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Specification<Document> specification = (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // marketplace approved only
            predicates.add(
                    cb.equal(root.get("visibility"), Visibility.MARKETPLACE));

            predicates.add(
                    cb.equal(root.get("marketStatus"), MarketStatus.APPROVED));
            predicates.add(
                    cb.equal(root.get("processingStatus"), ProcessingStatus.SUCCESS));
            predicates.add(
                    cb.equal(root.get("moderationStatus"), DocumentModerationStatus.SAFE));

            // keyword
            if (keyword != null && !keyword.isBlank()) {

                String keywordLike = "%" + keyword.toLowerCase() + "%";

                Join<Document, Subject> subjectJoin = root.join("subject", JoinType.LEFT);

                Join<Document, DocumentTag> dtJoin = root.join("documentTags", JoinType.LEFT);

                Join<DocumentTag, Tag> tagJoin = dtJoin.join("tag", JoinType.LEFT);

                Predicate p1 = cb.like(cb.lower(root.get("title")), keywordLike);

                Predicate p2 = cb.like(cb.lower(root.get("description")), keywordLike);

                Predicate p3 = cb.like(cb.lower(subjectJoin.get("code")), keywordLike);

                Predicate p4 = cb.like(cb.lower(tagJoin.get("name")), keywordLike);

                predicates.add(cb.or(p1, p2, p3, p4));
            }

            // subject
            if (subjectId != null) {
                predicates.add(
                        cb.equal(
                                root.get("subject").get("id"),
                                subjectId));
            }

            // semester
            if (semesterId != null) {

                Join<Document, User> userJoin = root.join("user");

                predicates.add(
                        cb.equal(
                                userJoin
                                        .get("currentSemester")
                                        .get("id"),
                                semesterId));
            }

            // file type
            if (fileType != null && !fileType.isBlank()) {
                predicates.add(
                        cb.equal(
                                root.get("fileType"),
                                fileType));
                predicates.add(
                        cb.equal(
                                root.get("visibility"),
                                Visibility.MARKETPLACE));

                predicates.add(
                        cb.equal(
                                root.get("marketStatus"),
                                MarketStatus.APPROVED));

                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Document> documentPage = documentRepository.findAll(specification, pageable);

        return documentPage.map(this::mapToResponse);
    }

    @Override
    public CommunityDocumentResponse getDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!isPublicSafeDocument(document)) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return mapToResponse(document);
    }

    @Override
    public List<CommunityDocumentResponse> getTopDocuments() {
        Pageable pageable = PageRequest.of(
                0,
                10,
                Sort.by("downloadCount").descending());

        Page<Document> page = documentRepository.findAll(pageable);

        return page.stream()
                .filter(this::isPublicSafeDocument)
                .map(this::mapToResponse)
                .toList();
    }

    private boolean isPublicSafeDocument(Document document) {
        return document.getVisibility() == Visibility.MARKETPLACE
                && document.getMarketStatus() == MarketStatus.APPROVED
                && document.getProcessingStatus() == ProcessingStatus.SUCCESS
                && document.getModerationStatus() == DocumentModerationStatus.SAFE;
    }

    private CommunityDocumentResponse mapToResponse(Document document) {

        CommunityDocumentResponse.UploaderInfo uploader = CommunityDocumentResponse.UploaderInfo.builder()
                .id(document.getUser().getId())
                .fullName(document.getUser().getFullName())
                .avatarUrl(document.getUser().getAvatarUrl())
                .build();

        SubjectResponse subjectResponse = null;

        if (document.getSubject() != null) {
            subjectResponse = SubjectResponse.builder()
                    .id(document.getSubject().getId())
                    .code(document.getSubject().getCode())
                    .name(document.getSubject().getName())
                    .standardSemesterNumber(
                            document.getSubject().getStandardSemesterNumber())
                    .build();
        }

        List<TagResponse> tags = documentTagRepository
                .findByDocumentId(document.getId())
                .stream()
                .map(dt -> TagResponse.builder()
                        .id(dt.getTag().getId())
                        .name(dt.getTag().getName())
                        .type(dt.getTag().getType())
                        .color(dt.getTag().getColor())
                        .build())
                .toList();

        return CommunityDocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .downloadCount(document.getDownloadCount())
                .reviewCount(document.getReviewCount())
                .acceptPercentage(document.getAcceptPercentage())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .uploader(uploader)
                .subject(subjectResponse)
                .tags(tags)
                .build();
    }
}
