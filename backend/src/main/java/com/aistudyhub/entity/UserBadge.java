package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Owner: BE3 – Reward module
 */
@Entity
@Table(name = "user_badges", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "badge_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @CreationTimestamp
    @Column(name = "earned_at", updatable = false)
    private LocalDateTime earnedAt;
}
