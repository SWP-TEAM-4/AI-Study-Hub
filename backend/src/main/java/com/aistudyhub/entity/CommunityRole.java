package com.aistudyhub.entity;

import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Owner: BE1/BE3 – Community Role module
 * Cấp quyền reviewer/moderator theo scope cụ thể.
 * <p>
 * grantedByUserId: bắt buộc có, ghi nhận ai đã cấp role.
 */
@Entity
@Table(name = "community_roles", indexes = {
        @Index(name = "idx_community_roles_user", columnList = "user_id"),
        @Index(name = "idx_community_roles_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by_user_id")
    private User grantedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 100)
    private CommunityRoleType roleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", length = 100)
    private CommunityScopeType scopeType;

    /**
     * ID của scope (subjectId, documentId, quizId, flashcardDeckId).
     * Null nếu scopeType = GLOBAL.
     */
    @Column(name = "scope_id")
    private Long scopeId;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CommunityRoleStatus status = CommunityRoleStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
