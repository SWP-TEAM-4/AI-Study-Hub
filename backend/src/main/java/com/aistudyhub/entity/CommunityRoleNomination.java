package com.aistudyhub.entity;

import com.aistudyhub.common.enums.CommunityRoleNominationStatus;
import com.aistudyhub.common.enums.CommunityRoleNominationType;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_role_nominations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "role_type", "scope_type", "scope_id", "period_key"})
}, indexes = {
        @Index(name = "idx_role_nomination_status", columnList = "status"),
        @Index(name = "idx_role_nomination_subject_period", columnList = "subject_id,period_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityRoleNomination {

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
    @Column(name = "nomination_type", nullable = false, length = 60)
    private CommunityRoleNominationType nominationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 100)
    private CommunityRoleType roleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 100)
    private CommunityScopeType scopeType;

    @Column(name = "scope_id")
    private Long scopeId;

    @Column(name = "period_key", nullable = false, length = 7)
    private String periodKey;

    @Column(nullable = false)
    @Builder.Default
    private Integer score = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CommunityRoleNominationStatus status = CommunityRoleNominationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "effective_start_at")
    private LocalDateTime effectiveStartAt;

    @Column(name = "effective_end_at")
    private LocalDateTime effectiveEndAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
