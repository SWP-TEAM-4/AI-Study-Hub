package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentSafetyReviewEventType;
import com.aistudyhub.common.enums.DocumentSafetyReviewStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentSafetyReview;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.document.dto.DocumentSafetyReviewDecisionRequest;
import com.aistudyhub.module.document.dto.DocumentSafetyReviewResponse;
import com.aistudyhub.module.document.dto.DocumentSafetySettingsResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentSafetySettingsRequest;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.service.SystemConfigService;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentSafetyReviewRepository;
import com.aistudyhub.repository.DocumentShareLinkRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentSafetyReviewService {

    private static final String SAFETY_DESCRIPTION =
            "Enable Gemini document safety review during chunking and edited chunk review";
    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;
    private static final int MAX_EXCERPT_LENGTH = 1200;

    private final DocumentSafetyReviewRepository reviewRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentShareLinkRepository documentShareLinkRepository;
    private final UserRepository userRepository;
    private final SystemConfigService systemConfigService;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public boolean isSafetyModerationEnabled() {
        return systemConfigService.getBooleanValueOrDefault(
                SystemConfigKeys.DOCUMENT_SAFETY_MODERATION_ENABLED,
                true);
    }

    @Transactional(readOnly = true)
    public DocumentSafetySettingsResponse getSettings() {
        return DocumentSafetySettingsResponse.builder()
                .configKey(SystemConfigKeys.DOCUMENT_SAFETY_MODERATION_ENABLED)
                .enabled(isSafetyModerationEnabled())
                .description(SAFETY_DESCRIPTION)
                .build();
    }

    @Transactional
    public DocumentSafetySettingsResponse updateSettings(UpdateDocumentSafetySettingsRequest request,
                                                         Long actorUserId) {
        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        systemConfigService.upsertValueByKey(
                SystemConfigKeys.DOCUMENT_SAFETY_MODERATION_ENABLED,
                Boolean.toString(enabled),
                SAFETY_DESCRIPTION,
                actorUserId);
        logSettingsMutation(actorUserId, enabled);
        return getSettings();
    }

    @Transactional
    public void recordNotApproved(Document document,
                                  Long triggeredByUserId,
                                  DocumentSafetyReviewEventType eventType,
                                  GeminiChunkingService.SafetyReview safetyReview,
                                  DocumentModerationStatus moderationStatus,
                                  String moderationNote,
                                  String textExcerpt) {
        if (document == null || document.getId() == null) {
            return;
        }

        User owner = document.getUser();
        User triggeredBy = triggeredByUserId == null
                ? owner
                : userRepository.findById(triggeredByUserId).orElse(owner);

        DocumentSafetyReview saved = reviewRepository.save(DocumentSafetyReview.builder()
                .document(document)
                .ownerUser(owner)
                .triggeredByUser(triggeredBy)
                .eventType(eventType)
                .reviewStatus(DocumentSafetyReviewStatus.PENDING)
                .documentModerationStatus(moderationStatus)
                .violationSeverity(resolveSeverity(safetyReview))
                .category(normalizeNullable(safetyReview == null ? null : safetyReview.category()))
                .confidence(toConfidence(safetyReview == null ? null : safetyReview.confidence()))
                .policyFlags(toPolicyFlagsText(safetyReview == null ? null : safetyReview.policyFlags()))
                .reason(normalizeNullable(safetyReview == null ? null : safetyReview.reason()))
                .moderationNote(normalizeNullable(moderationNote))
                .textExcerpt(truncateExcerpt(textExcerpt))
                .build());

        Long actorId = triggeredBy != null ? triggeredBy.getId() : null;
        logReviewMutation(actorId, saved, ActivityActionType.DOCUMENT_SAFETY_REVIEW_CREATED, "CREATE");
        log.info("Recorded document safety review id={} documentId={} status={} severity={}",
                saved.getId(), document.getId(), moderationStatus, saved.getViolationSeverity());
    }

    @Transactional(readOnly = true)
    public PaginationResponse<DocumentSafetyReviewResponse> listReviews(String status,
                                                                        String severity,
                                                                        String keyword,
                                                                        int page,
                                                                        int size,
                                                                        String sort) {
        Page<DocumentSafetyReviewResponse> result = reviewRepository.findAll(
                        buildFilterSpec(status, severity, keyword),
                        PageRequest.of(normalizePage(page), normalizeSize(size), buildSort(sort)))
                .map(this::toResponse);
        return PaginationResponse.of(result);
    }

    @Transactional
    public DocumentSafetyReviewResponse approve(Long id,
                                                DocumentSafetyReviewDecisionRequest request,
                                                Long adminUserId) {
        DocumentSafetyReview review = findReviewOrThrow(id);
        User admin = findUserOrThrow(adminUserId);

        review.setReviewStatus(DocumentSafetyReviewStatus.APPROVED);
        review.setReviewerUser(admin);
        review.setReviewedAt(LocalDateTime.now());
        review.setReviewedNote(normalizeNullable(request == null ? null : request.getNote()));

        Document document = review.getDocument();
        if (document != null) {
            long chunkCount = documentChunkRepository.countByDocumentId(document.getId());
            document.setModerationStatus(DocumentModerationStatus.SAFE);
            document.setViolationSeverity(DocumentViolationSeverity.NONE);
            document.setModerationNote(buildAdminDecisionNote("approved", review.getReviewedNote()));
            document.setModeratedAt(LocalDateTime.now());
            document.setAiVerdictNote("Admin approved safety review #" + review.getId());
            document.setProcessingStatus(chunkCount > 0 ? ProcessingStatus.SUCCESS : ProcessingStatus.PENDING);
            if (document.getMarketStatus() == MarketStatus.REJECTED) {
                document.setMarketStatus(MarketStatus.NONE);
            }
            documentRepository.save(document);
        }

        DocumentSafetyReview saved = reviewRepository.save(review);
        logReviewMutation(adminUserId, saved, ActivityActionType.APPROVE_DOCUMENT_SAFETY, "APPROVE");
        return toResponse(saved);
    }

    @Transactional
    public DocumentSafetyReviewResponse reject(Long id,
                                               DocumentSafetyReviewDecisionRequest request,
                                               Long adminUserId) {
        DocumentSafetyReview review = findReviewOrThrow(id);
        User admin = findUserOrThrow(adminUserId);

        review.setReviewStatus(DocumentSafetyReviewStatus.REJECTED);
        review.setReviewerUser(admin);
        review.setReviewedAt(LocalDateTime.now());
        review.setReviewedNote(normalizeNullable(request == null ? null : request.getNote()));

        Document document = review.getDocument();
        if (document != null) {
            document.setProcessingStatus(ProcessingStatus.FAILED);
            document.setModerationStatus(DocumentModerationStatus.BLOCKED);
            document.setViolationSeverity(review.getViolationSeverity());
            document.setModerationNote(buildAdminDecisionNote("rejected", review.getReviewedNote()));
            document.setModeratedAt(LocalDateTime.now());
            document.setVisibility(Visibility.PRIVATE);
            document.setMarketStatus(MarketStatus.REJECTED);
            document.setAiVerdictNote("Admin rejected safety review #" + review.getId());
            disableShareLink(document.getId());
            documentRepository.save(document);
        }

        DocumentSafetyReview saved = reviewRepository.save(review);
        logReviewMutation(adminUserId, saved, ActivityActionType.REJECT_DOCUMENT_SAFETY, "REJECT");
        return toResponse(saved);
    }

    private Specification<DocumentSafetyReview> buildFilterSpec(String status,
                                                                String severity,
                                                                String keyword) {
        return Specification.where(hasReviewStatus(status))
                .and(hasSeverity(severity))
                .and(hasKeyword(keyword));
    }

    private Specification<DocumentSafetyReview> hasReviewStatus(String status) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(status) || "ALL".equalsIgnoreCase(status)) {
                return cb.conjunction();
            }
            try {
                return cb.equal(root.get("reviewStatus"),
                        DocumentSafetyReviewStatus.valueOf(status.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                return cb.disjunction();
            }
        };
    }

    private Specification<DocumentSafetyReview> hasSeverity(String severity) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(severity) || "ALL".equalsIgnoreCase(severity)) {
                return cb.conjunction();
            }
            try {
                return cb.equal(root.get("violationSeverity"),
                        DocumentViolationSeverity.valueOf(severity.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                return cb.disjunction();
            }
        };
    }

    private Specification<DocumentSafetyReview> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("reason")), pattern),
                    cb.like(cb.lower(root.get("moderationNote")), pattern),
                    cb.like(cb.lower(root.get("textExcerpt")), pattern),
                    cb.like(cb.lower(root.join("document").get("title")), pattern),
                    cb.like(cb.lower(root.join("ownerUser").get("fullName")), pattern)
            );
        };
    }

    private int normalizePage(int page) {
        return Math.max(page, DEFAULT_PAGE);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private Sort buildSort(String sort) {
        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, "createdAt");
    }

    private DocumentSafetyReview findReviewOrThrow(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND,
                        "Document safety review not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private DocumentViolationSeverity resolveSeverity(GeminiChunkingService.SafetyReview safetyReview) {
        if (safetyReview == null || safetyReview.severity() == null) {
            return DocumentViolationSeverity.HIGH;
        }
        return safetyReview.severity();
    }

    private BigDecimal toConfidence(Double confidence) {
        if (confidence == null || confidence.isNaN() || confidence.isInfinite()) {
            return null;
        }
        double clamped = Math.max(0.0, Math.min(1.0, confidence));
        return BigDecimal.valueOf(clamped).setScale(4, RoundingMode.HALF_UP);
    }

    private String toPolicyFlagsText(List<String> policyFlags) {
        if (policyFlags == null || policyFlags.isEmpty()) {
            return null;
        }
        String joined = policyFlags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElse(null);
        return StringUtils.hasText(joined) ? joined : null;
    }

    private List<String> toPolicyFlagsList(String policyFlags) {
        if (!StringUtils.hasText(policyFlags)) {
            return List.of();
        }
        return Arrays.stream(policyFlags.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private String truncateExcerpt(String text) {
        String normalized = normalizeNullable(text);
        if (normalized == null || normalized.length() <= MAX_EXCERPT_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, MAX_EXCERPT_LENGTH);
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String buildAdminDecisionNote(String decision, String note) {
        String base = "Admin " + decision + " document safety review.";
        return StringUtils.hasText(note) ? base + " " + note.trim() : base;
    }

    private void disableShareLink(Long documentId) {
        documentShareLinkRepository.findByDocumentId(documentId).ifPresent(shareLink -> {
            shareLink.setEnabled(false);
            shareLink.setAllowPreview(false);
            shareLink.setAllowDownload(false);
            documentShareLinkRepository.save(shareLink);
        });
    }

    private void logSettingsMutation(Long actorUserId, boolean enabled) {
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("enabled", enabled);
        metadata.put("configKey", SystemConfigKeys.DOCUMENT_SAFETY_MODERATION_ENABLED);
        activityLogService.log(
                actorUserId,
                ActivityActionType.UPDATE_DOCUMENT_SAFETY_SETTINGS,
                ActivityTargetType.SYSTEM_CONFIG,
                null,
                metadata,
                SystemConfigKeys.DOCUMENT_SAFETY_MODERATION_ENABLED,
                Boolean.toString(enabled));
    }

    private void logReviewMutation(Long actorUserId,
                                   DocumentSafetyReview review,
                                   ActivityActionType action,
                                   String operation) {
        if (actorUserId == null) {
            return;
        }
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("operation", operation);
        metadata.put("documentId", review.getDocument() != null ? review.getDocument().getId() : null);
        metadata.put("reviewStatus", review.getReviewStatus());
        metadata.put("documentModerationStatus", review.getDocumentModerationStatus());
        metadata.put("violationSeverity", review.getViolationSeverity());
        metadata.put("category", review.getCategory());
        activityLogService.log(
                actorUserId,
                action,
                ActivityTargetType.DOCUMENT_SAFETY_REVIEW,
                review.getId(),
                metadata,
                review.getDocument() != null ? review.getDocument().getTitle() : null,
                review.getReason(),
                review.getModerationNote());
    }

    private DocumentSafetyReviewResponse toResponse(DocumentSafetyReview review) {
        Document document = review.getDocument();
        User owner = review.getOwnerUser();
        User triggeredBy = review.getTriggeredByUser();
        User reviewer = review.getReviewerUser();

        return DocumentSafetyReviewResponse.builder()
                .id(review.getId())
                .documentId(document != null ? document.getId() : null)
                .documentTitle(document != null ? document.getTitle() : null)
                .ownerUserId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .triggeredByUserId(triggeredBy != null ? triggeredBy.getId() : null)
                .reviewerUserId(reviewer != null ? reviewer.getId() : null)
                .eventType(review.getEventType())
                .reviewStatus(review.getReviewStatus())
                .documentModerationStatus(review.getDocumentModerationStatus())
                .violationSeverity(review.getViolationSeverity())
                .category(review.getCategory())
                .confidence(review.getConfidence() != null ? review.getConfidence().doubleValue() : null)
                .policyFlags(toPolicyFlagsList(review.getPolicyFlags()))
                .reason(review.getReason())
                .moderationNote(review.getModerationNote())
                .textExcerpt(review.getTextExcerpt())
                .reviewedNote(review.getReviewedNote())
                .createdAt(review.getCreatedAt())
                .reviewedAt(review.getReviewedAt())
                .build();
    }
}
