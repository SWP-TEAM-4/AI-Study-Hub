package com.aistudyhub.entity;

import com.aistudyhub.common.enums.ReviewPolicyMode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "subject_review_policies", uniqueConstraints = @UniqueConstraint(columnNames = "subject_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubjectReviewPolicy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "policy_mode", nullable = false, length = 30)
    @Builder.Default
    private ReviewPolicyMode mode = ReviewPolicyMode.SINGLE_REVIEWER;

    @Column(name = "required_votes", nullable = false)
    @Builder.Default
    private Integer requiredVotes = 1;

    @Column(name = "approval_percentage", nullable = false)
    @Builder.Default
    private Integer approvalPercentage = 100;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
