package com.aistudyhub.entity;

import com.aistudyhub.common.enums.ReputationEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reputation_events", indexes = {
        @Index(name = "idx_reputation_events_user_period", columnList = "user_id,period_key"),
        @Index(name = "idx_reputation_events_subject_period", columnList = "subject_id,period_key"),
        @Index(name = "idx_reputation_events_event_type", columnList = "event_type"),
        @Index(name = "idx_reputation_events_source", columnList = "source_type,source_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReputationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 80)
    private ReputationEventType eventType;

    @Column(name = "target_type", length = 40)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "source_type", length = 80)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "points_delta", nullable = false)
    private Integer pointsDelta;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 255)
    private String idempotencyKey;

    @Column(name = "period_key", nullable = false, length = 7)
    private String periodKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
