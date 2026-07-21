package com.aistudyhub.entity;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Owner: BE2 – Document module (Skeleton created by BE1 to unblock BE-016 RAG
 * Core)
 * <p>
 * Maps to table `documents` defined in V1__init_schema.sql.
 * BE2 sẽ bổ sung thêm service/controller/dto cho BE-012, BE-013.
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_documents_user", columnList = "user_id"),
        @Index(name = "idx_documents_subject", columnList = "subject_id"),
        @Index(name = "idx_documents_visibility", columnList = "visibility, market_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "cloud_file_path", length = 500)
    private String cloudFilePath;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Visibility visibility = Visibility.PRIVATE;

    @Enumerated(EnumType.STRING)
    @Column(name = "market_status", nullable = false, length = 50)
    @Builder.Default
    private MarketStatus marketStatus = MarketStatus.NONE;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "accept_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal acceptPercentage = BigDecimal.ZERO;

    @Column(name = "community_review_count", nullable = false)
    @Builder.Default
    private Integer communityReviewCount = 0;

    @Column(name = "community_rating_avg", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal communityRatingAvg = BigDecimal.ZERO;

    @Column(name = "ai_verdict_note", columnDefinition = "TEXT")
    private String aiVerdictNote;

    @Column(name = "submit_note", columnDefinition = "TEXT")
    private String submitNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 50)
    @Builder.Default
    private ProcessingStatus processingStatus = ProcessingStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloned_from_id")
    private Document clonedFrom;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "document", fetch = FetchType.LAZY)
    private List<DocumentTag> documentTags;
}
