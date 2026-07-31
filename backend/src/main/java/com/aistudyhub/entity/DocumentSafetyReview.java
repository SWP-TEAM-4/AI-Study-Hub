package com.aistudyhub.entity;

import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentSafetyReviewEventType;
import com.aistudyhub.common.enums.DocumentSafetyReviewStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_safety_reviews", indexes = {
        @Index(name = "idx_document_safety_reviews_status", columnList = "review_status"),
        @Index(name = "idx_document_safety_reviews_document", columnList = "document_id"),
        @Index(name = "idx_document_safety_reviews_owner", columnList = "owner_user_id"),
        @Index(name = "idx_document_safety_reviews_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSafetyReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User ownerUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_user_id")
    private User triggeredByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_user_id")
    private User reviewerUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private DocumentSafetyReviewEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 50)
    @Builder.Default
    private DocumentSafetyReviewStatus reviewStatus = DocumentSafetyReviewStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_moderation_status", nullable = false, length = 50)
    private DocumentModerationStatus documentModerationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_severity", nullable = false, length = 50)
    @Builder.Default
    private DocumentViolationSeverity violationSeverity = DocumentViolationSeverity.NONE;

    @Column(length = 100)
    private String category;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "policy_flags", columnDefinition = "TEXT")
    private String policyFlags;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;

    @Column(name = "text_excerpt", columnDefinition = "TEXT")
    private String textExcerpt;

    @Column(name = "reviewed_note", columnDefinition = "TEXT")
    private String reviewedNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
