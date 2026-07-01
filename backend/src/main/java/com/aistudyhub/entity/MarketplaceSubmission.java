package com.aistudyhub.entity;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ReviewPolicyMode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketplace_submissions", uniqueConstraints =
        @UniqueConstraint(columnNames = {"target_type", "target_id", "submission_round"}), indexes = {
        @Index(name = "idx_marketplace_submission_status", columnList = "status"),
        @Index(name = "idx_marketplace_submission_subject", columnList = "subject_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MarketplaceSubmission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "subject_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Subject subject;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "submission_round", nullable = false)
    private Integer submissionRound;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    @Builder.Default
    private MarketStatus status = MarketStatus.PENDING;

    @Enumerated(EnumType.STRING) @Column(name = "policy_mode_snapshot", nullable = false, length = 30)
    private ReviewPolicyMode policyModeSnapshot;
    @Column(name = "required_votes_snapshot", nullable = false)
    private Integer requiredVotesSnapshot;
    @Column(name = "approval_percentage_snapshot", nullable = false)
    private Integer approvalPercentageSnapshot;

    @Column(name = "submit_note", columnDefinition = "TEXT")
    private String submitNote;
    @CreationTimestamp @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;
    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "decided_by_id")
    private User decidedBy;
    @Version
    private Long version;
}
