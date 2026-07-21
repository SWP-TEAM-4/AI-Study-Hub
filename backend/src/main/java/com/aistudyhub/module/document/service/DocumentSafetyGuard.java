package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DocumentSafetyGuard {

    private final DocumentChunkRepository documentChunkRepository;

    public void assertDistributable(Document document) {
        if (document == null) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        if (document.getModerationStatus() == DocumentModerationStatus.BLOCKED) {
            throw new AppException(ErrorCode.DOCUMENT_BLOCKED_BY_MODERATION,
                    resolveBlockedMessage(document));
        }
        if (document.getProcessingStatus() != ProcessingStatus.SUCCESS
                || document.getModerationStatus() != DocumentModerationStatus.SAFE
                || documentChunkRepository.countByDocumentId(document.getId()) <= 0) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_SAFE_FOR_DISTRIBUTION);
        }
    }

    public boolean isDistributable(Document document) {
        if (document == null || document.getId() == null) {
            return false;
        }
        return document.getProcessingStatus() == ProcessingStatus.SUCCESS
                && document.getModerationStatus() == DocumentModerationStatus.SAFE
                && documentChunkRepository.countByDocumentId(document.getId()) > 0;
    }

    private String resolveBlockedMessage(Document document) {
        String note = document.getModerationNote();
        if (note == null || note.isBlank()) {
            return ErrorCode.DOCUMENT_BLOCKED_BY_MODERATION.getMessage();
        }
        return ErrorCode.DOCUMENT_BLOCKED_BY_MODERATION.getMessage() + " " + note;
    }
}
