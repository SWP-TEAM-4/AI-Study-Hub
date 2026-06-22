package com.aistudyhub.entity;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.ChatMessageType;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.enums.PracticeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Owner: BE1 – Chat/RAG core
 * <p>
 * Represents one message inside a chat session. Each question/answer turn
 * creates two messages with increasing sequence numbers.
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_messages_session", columnList = "session_id, message_sequence")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @Column(name = "message_sequence", nullable = false)
    private Integer messageSequence;

    @Column(name = "sender_role", nullable = false, length = 50)
    private String senderRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 50)
    @Builder.Default
    private ChatMessageType messageType = ChatMessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "practice_type", length = 30)
    private AiPracticeType practiceType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Lob
    @Column(name = "cited_sources", columnDefinition = "TEXT")
    private String citedSources;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generated_payload")
    private JsonNode generatedPayload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_errors")
    private JsonNode validationErrors;

    @Enumerated(EnumType.STRING)
    @Column(name = "practice_status", nullable = false, length = 30)
    @Builder.Default
    private PracticeStatus practiceStatus = PracticeStatus.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "imported_target_type", length = 30)
    private PracticeImportTargetType importedTargetType;

    @Column(name = "imported_target_id")
    private Long importedTargetId;

    @Column(name = "imported_at")
    private LocalDateTime importedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
