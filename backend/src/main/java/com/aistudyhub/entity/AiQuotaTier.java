package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_quota_tiers", indexes = {
        @Index(name = "idx_ai_quota_tiers_min_points", columnList = "min_reputation_points")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiQuotaTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(name = "min_reputation_points", nullable = false, unique = true)
    private Integer minReputationPoints;

    @Column(name = "daily_chat_limit", nullable = false)
    private Integer dailyChatLimit;

    @Column(name = "monthly_chat_limit", nullable = false)
    private Integer monthlyChatLimit;

    @Column(name = "daily_summary_limit", nullable = false)
    private Integer dailySummaryLimit;

    @Column(name = "monthly_summary_limit", nullable = false)
    private Integer monthlySummaryLimit;

    @Column(name = "daily_generation_limit", nullable = false)
    private Integer dailyGenerationLimit;

    @Column(name = "monthly_generation_limit", nullable = false)
    private Integer monthlyGenerationLimit;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
