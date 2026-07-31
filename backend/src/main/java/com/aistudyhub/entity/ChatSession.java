package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Owner: BE1 – Chat/RAG core
 * <p>
 * Represents a chat session scoped to a notebook and owned by a single user.
 */
@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notebook_id", nullable = false)
    private Notebook notebook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 255)
    private String title;

    @Column(name = "is_private", nullable = false)
    @Builder.Default
    private Boolean isPrivate = false;

    @Column(name = "admin_access_allowed", nullable = false)
    @Builder.Default
    private Boolean adminAccessAllowed = false;

    @Column(name = "reported_to_admin", nullable = false)
    @Builder.Default
    private Boolean reportedToAdmin = false;

    @Column(name = "admin_report_reason", columnDefinition = "TEXT")
    private String adminReportReason;

    @Column(name = "admin_reported_at")
    private LocalDateTime adminReportedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
