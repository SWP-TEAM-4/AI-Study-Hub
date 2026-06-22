package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.utils.DateUtil;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.DocumentShareLink;
import com.aistudyhub.module.document.dto.share.CreateDocumentShareLinkRequest;
import com.aistudyhub.module.document.dto.share.DocumentShareLinkDeleteResponse;
import com.aistudyhub.module.document.dto.share.DocumentShareLinkResponse;
import com.aistudyhub.module.document.dto.share.PublicDocumentSharePreviewResponse;
import com.aistudyhub.module.document.dto.share.UpdateDocumentShareLinkRequest;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentShareLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentShareLinkService {

    private static final int PREVIEW_MAX_CHARS = 1000;

    private final DocumentRepository documentRepository;
    private final DocumentShareLinkRepository documentShareLinkRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final StorageService storageService;

    @Transactional
    public DocumentShareLinkResponse createShareLink(Long documentId, Long currentUserId, boolean isAdmin,
                                                     CreateDocumentShareLinkRequest request) {
        Document document = resolveManageableDocument(documentId, currentUserId, isAdmin);
        if (documentShareLinkRepository.findByDocumentId(documentId).isPresent()) {
            throw new AppException(ErrorCode.DOCUMENT_SHARE_LINK_ALREADY_EXISTS);
        }

        boolean allowPreview = request == null || request.getAllowPreview() == null || request.getAllowPreview();
        boolean allowDownload = request == null || request.getAllowDownload() == null || request.getAllowDownload();
        LocalDateTime expiresAt = request != null ? request.getExpiresAt() : null;

        validateExpiry(expiresAt);
        validateAccessOptions(true, allowPreview, allowDownload);

        DocumentShareLink shareLink = DocumentShareLink.builder()
                .document(document)
                .ownerUser(document.getUser())
                .shareToken(generateUniqueShareToken())
                .allowPreview(allowPreview)
                .allowDownload(allowDownload)
                .expiresAt(expiresAt)
                .accessCount(0)
                .build();

        syncVisibilityOnShareEnabled(document);
        documentRepository.save(document);

        shareLink = documentShareLinkRepository.save(shareLink);
        return toShareLinkResponse(shareLink);
    }

    @Transactional(readOnly = true)
    public DocumentShareLinkResponse getShareLink(Long documentId, Long currentUserId, boolean isAdmin) {
        Document document = resolveManageableDocument(documentId, currentUserId, isAdmin);
        DocumentShareLink shareLink = documentShareLinkRepository.findByDocumentId(document.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_SHARE_LINK_NOT_FOUND));
        return toShareLinkResponse(shareLink);
    }

    @Transactional
    public DocumentShareLinkResponse updateShareLink(Long documentId, Long currentUserId, boolean isAdmin,
                                                     UpdateDocumentShareLinkRequest request) {
        Document document = resolveManageableDocument(documentId, currentUserId, isAdmin);
        DocumentShareLink shareLink = documentShareLinkRepository.findByDocumentId(document.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_SHARE_LINK_NOT_FOUND));

        boolean enabled = request.getIsEnabled() != null ? request.getIsEnabled() : shareLink.isEnabled();
        boolean allowPreview = request.getAllowPreview() != null ? request.getAllowPreview() : shareLink.isAllowPreview();
        boolean allowDownload = request.getAllowDownload() != null ? request.getAllowDownload() : shareLink.isAllowDownload();
        LocalDateTime expiresAt = request.getExpiresAt() != null ? request.getExpiresAt() : shareLink.getExpiresAt();

        validateExpiry(request.getExpiresAt());
        validateAccessOptions(enabled, allowPreview, allowDownload);

        if (request.getIsEnabled() != null) {
            shareLink.setEnabled(request.getIsEnabled());
        }
        if (request.getAllowPreview() != null) {
            shareLink.setAllowPreview(request.getAllowPreview());
        }
        if (request.getAllowDownload() != null) {
            shareLink.setAllowDownload(request.getAllowDownload());
        }
        if (request.getExpiresAt() != null) {
            shareLink.setExpiresAt(request.getExpiresAt());
        }

        if (enabled) {
            syncVisibilityOnShareEnabled(document);
        } else {
            syncVisibilityOnShareDisabled(document);
        }

        documentRepository.save(document);
        shareLink = documentShareLinkRepository.save(shareLink);
        return toShareLinkResponse(shareLink);
    }

    @Transactional
    public DocumentShareLinkDeleteResponse deleteShareLink(Long documentId, Long currentUserId, boolean isAdmin) {
        Document document = resolveManageableDocument(documentId, currentUserId, isAdmin);
        DocumentShareLink shareLink = documentShareLinkRepository.findByDocumentId(document.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_SHARE_LINK_NOT_FOUND));

        documentShareLinkRepository.delete(shareLink);
        syncVisibilityOnShareDisabled(document);
        documentRepository.save(document);

        return DocumentShareLinkDeleteResponse.builder()
                .deleted(true)
                .documentVisibility(document.getVisibility())
                .build();
    }

    @Transactional
    public PublicDocumentSharePreviewResponse getPublicPreview(String shareToken) {
        DocumentShareLink shareLink = resolvePublicShareLink(shareToken);
        if (!shareLink.isAllowPreview()) {
            throw new AppException(ErrorCode.PREVIEW_NOT_ALLOWED);
        }

        registerAccess(shareLink, false);
        PreviewData previewData = buildPreviewData(shareLink.getDocument().getId());
        return toPublicPreviewResponse(shareLink, previewData);
    }

    @Transactional
    public SharedDocumentDownload downloadSharedDocument(String shareToken) {
        DocumentShareLink shareLink = resolvePublicShareLink(shareToken);
        if (!shareLink.isAllowDownload()) {
            throw new AppException(ErrorCode.DOWNLOAD_NOT_ALLOWED);
        }

        Document document = shareLink.getDocument();
        if (!StringUtils.hasText(document.getCloudFilePath())) {
            throw new AppException(ErrorCode.DOCUMENT_NO_FILE);
        }

        byte[] content = storageService.readFileContent(document.getCloudFilePath());
        if (content == null || content.length == 0) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Shared document file is unavailable");
        }

        registerAccess(shareLink, true);
        return new SharedDocumentDownload(content, resolveMediaType(document.getFileType()), buildFilename(document));
    }

    private Document resolveManageableDocument(Long documentId, Long currentUserId, boolean isAdmin) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (!isAdmin && !document.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
        }
        return document;
    }

    private DocumentShareLink resolvePublicShareLink(String shareToken) {
        DocumentShareLink shareLink = documentShareLinkRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_SHARE_LINK_NOT_FOUND));

        if (!shareLink.isEnabled()) {
            throw new AppException(ErrorCode.DOCUMENT_SHARE_LINK_DISABLED);
        }
        if (shareLink.getExpiresAt() != null && DateUtil.isExpired(shareLink.getExpiresAt())) {
            throw new AppException(ErrorCode.DOCUMENT_SHARE_LINK_EXPIRED);
        }
        return shareLink;
    }

    private void validateExpiry(LocalDateTime expiresAt) {
        if (expiresAt != null && !expiresAt.isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "expiresAt must be in the future");
        }
    }

    private void validateAccessOptions(boolean enabled, boolean allowPreview, boolean allowDownload) {
        if (enabled && !allowPreview && !allowDownload) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "At least one of preview or download must be allowed when share link is enabled");
        }
    }

    private void syncVisibilityOnShareEnabled(Document document) {
        if (document.getVisibility() != Visibility.MARKETPLACE) {
            document.setVisibility(Visibility.PUBLIC_LINK);
        }
    }

    private void syncVisibilityOnShareDisabled(Document document) {
        if (document.getVisibility() == Visibility.MARKETPLACE || document.getMarketStatus() == MarketStatus.APPROVED) {
            document.setVisibility(Visibility.MARKETPLACE);
        } else {
            document.setVisibility(Visibility.PRIVATE);
        }
    }

    private void registerAccess(DocumentShareLink shareLink, boolean countAsDownload) {
        shareLink.setAccessCount(shareLink.getAccessCount() + 1);
        shareLink.setLastAccessedAt(LocalDateTime.now());

        if (countAsDownload) {
            Document document = shareLink.getDocument();
            document.setDownloadCount(document.getDownloadCount() + 1);
            documentRepository.save(document);
        }

        documentShareLinkRepository.save(shareLink);
    }

    private PreviewData buildPreviewData(Long documentId) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId);
        if (chunks.isEmpty()) {
            return new PreviewData(null, null);
        }

        String previewText = chunks.stream()
                .limit(2)
                .map(DocumentChunk::getTextContent)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining("\n\n"));

        if (previewText.length() > PREVIEW_MAX_CHARS) {
            previewText = previewText.substring(0, PREVIEW_MAX_CHARS) + "...";
        }

        return new PreviewData(previewText, chunks.get(0).getSourcePage());
    }

    private DocumentShareLinkResponse toShareLinkResponse(DocumentShareLink shareLink) {
        return DocumentShareLinkResponse.builder()
                .id(shareLink.getId())
                .documentId(shareLink.getDocument().getId())
                .ownerUserId(shareLink.getOwnerUser().getId())
                .shareToken(shareLink.getShareToken())
                .shareUrl(buildShareUrl(shareLink.getShareToken()))
                .downloadUrl(buildDownloadUrl(shareLink.getShareToken()))
                .isEnabled(shareLink.isEnabled())
                .allowPreview(shareLink.isAllowPreview())
                .allowDownload(shareLink.isAllowDownload())
                .expiresAt(shareLink.getExpiresAt())
                .accessCount(shareLink.getAccessCount())
                .lastAccessedAt(shareLink.getLastAccessedAt())
                .createdAt(shareLink.getCreatedAt())
                .updatedAt(shareLink.getUpdatedAt())
                .documentVisibility(shareLink.getDocument().getVisibility())
                .build();
    }

    private PublicDocumentSharePreviewResponse toPublicPreviewResponse(DocumentShareLink shareLink, PreviewData previewData) {
        Document document = shareLink.getDocument();
        return PublicDocumentSharePreviewResponse.builder()
                .title(document.getTitle())
                .description(document.getDescription())
                .subjectId(document.getSubject() != null ? document.getSubject().getId() : null)
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .allowDownload(shareLink.isAllowDownload())
                .downloadUrl(shareLink.isAllowDownload() ? buildDownloadUrl(shareLink.getShareToken()) : null)
                .expiresAt(shareLink.getExpiresAt())
                .previewText(previewData.previewText())
                .previewSourcePage(previewData.previewSourcePage())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private String buildShareUrl(String shareToken) {
        return "/api/share/documents/" + shareToken;
    }

    private String buildDownloadUrl(String shareToken) {
        return buildShareUrl(shareToken) + "/download";
    }

    private String generateUniqueShareToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (documentShareLinkRepository.existsByShareToken(token));
        return token;
    }

    private MediaType resolveMediaType(String fileType) {
        if (!StringUtils.hasText(fileType)) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        return MediaTypeFactory.getMediaType("file." + fileType.toLowerCase())
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
    }

    private String buildFilename(Document document) {
        String extension = StringUtils.hasText(document.getFileType()) ? "." + document.getFileType().toLowerCase() : "";
        if (StringUtils.hasText(document.getTitle())
                && document.getTitle().toLowerCase().endsWith(extension)) {
            return document.getTitle();
        }
        return (StringUtils.hasText(document.getTitle()) ? document.getTitle() : "document") + extension;
    }

    private record PreviewData(String previewText, Integer previewSourcePage) {
    }

    public record SharedDocumentDownload(byte[] content, MediaType mediaType, String filename) {
    }
}
