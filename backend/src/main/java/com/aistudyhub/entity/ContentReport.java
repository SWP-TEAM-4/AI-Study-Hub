package com.aistudyhub.entity;

import com.aistudyhub.common.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity mapping bảng content_reports – lưu báo cáo vi phạm nội dung.
 * Mỗi report chỉ trỏ tới đúng 1 target (document / quiz / flashcard_deck).
 * Owner: BE3 (Task BE-044)
 */
@Entity
@Table(name = "content_reports", indexes = {
        @Index(name = "idx_content_reports_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /** Tài liệu bị báo cáo (nullable – chỉ 1 trong 3 target được set) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    /** Quiz bị báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    /** Bộ flashcard bị báo cáo */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_deck_id")
    private FlashcardDeck flashcardDeck;

    /** Lý do báo cáo: COPYRIGHT, SPAM, INAPPROPRIATE, ... */
    @Column(name = "reason_type", nullable = false, length = 100)
    private String reasonType;

    /** Chi tiết mô tả vi phạm */
    @Column(name = "report_details", columnDefinition = "TEXT")
    private String reportDetails;

    /** Mức độ nghiêm trọng: LOW, MEDIUM, HIGH */
    @Column(name = "severity_level", length = 50)
    @Builder.Default
    private String severityLevel = "LOW";

    /** Trạng thái xử lý: PENDING_ADMIN, RESOLVED, REJECTED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING_ADMIN;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
