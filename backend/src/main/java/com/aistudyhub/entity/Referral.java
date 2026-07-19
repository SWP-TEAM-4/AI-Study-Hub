package com.aistudyhub.entity;

import com.aistudyhub.common.enums.ReferralStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Owner: BE3 - Growth/referral module.
 */
@Entity
@Table(name = "referrals", uniqueConstraints = {
        @UniqueConstraint(name = "uq_referrals_owner_user", columnNames = "owner_user_id"),
        @UniqueConstraint(name = "uq_referrals_code", columnNames = "code")
}, indexes = {
        @Index(name = "idx_referrals_owner_user", columnList = "owner_user_id"),
        @Index(name = "idx_referrals_code", columnList = "code"),
        @Index(name = "idx_referrals_applied_referral", columnList = "applied_referral_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applied_referral_id")
    private Referral appliedReferral;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applied_by_user_id")
    private User appliedByUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ReferralStatus status = ReferralStatus.ACTIVE;

    @Column(name = "reward_points", nullable = false)
    @Builder.Default
    private Integer rewardPoints = 0;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
