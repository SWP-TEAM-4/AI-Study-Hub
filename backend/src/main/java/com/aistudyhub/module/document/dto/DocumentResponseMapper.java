package com.aistudyhub.module.document.dto;

import com.aistudyhub.entity.Document;

/**
 * Mapper dùng chung cho Document entity -> DTO response.
 */
public final class DocumentResponseMapper {

    private DocumentResponseMapper() {
    }

    public static DocumentResponse toResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .userId(doc.getUser().getId())
                .subjectId(doc.getSubject() != null ? doc.getSubject().getId() : null)
                .title(doc.getTitle())
                .description(doc.getDescription())
                .fileUrl(doc.getFileUrl())
                .cloudFilePath(doc.getCloudFilePath())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .visibility(doc.getVisibility())
                .marketStatus(doc.getMarketStatus())
                .downloadCount(doc.getDownloadCount())
                .reviewCount(doc.getReviewCount())
                .acceptPercentage(doc.getAcceptPercentage())
                .communityReviewCount(doc.getCommunityReviewCount())
                .communityRatingAvg(doc.getCommunityRatingAvg())
                .aiVerdictNote(doc.getAiVerdictNote())
                .processingStatus(doc.getProcessingStatus())
                .clonedFromId(doc.getClonedFrom() != null ? doc.getClonedFrom().getId() : null)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
