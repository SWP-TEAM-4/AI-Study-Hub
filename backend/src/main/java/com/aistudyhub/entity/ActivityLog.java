package com.aistudyhub.entity;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs", indexes = {
        @Index(name = "idx_activity_logs_actor_user", columnList = "actor_user_id"),
        @Index(name = "idx_activity_logs_action", columnList = "action"),
        @Index(name = "idx_activity_logs_target", columnList = "target_type, target_id"),
        @Index(name = "idx_activity_logs_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actorUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private ActivityActionType action;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 100)
    private ActivityTargetType targetType;

    @Column(name = "target_id")
    private Long targetId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private JsonNode metadata;

    @Column(name = "search_text", columnDefinition = "TEXT")
    private String searchText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
