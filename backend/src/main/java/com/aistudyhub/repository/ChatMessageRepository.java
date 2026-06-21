package com.aistudyhub.repository;

import com.aistudyhub.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdOrderByMessageSequenceAsc(Long sessionId);

    @Query("""
            select max(m.messageSequence)
            from ChatMessage m
            where m.session.id = :sessionId
            """)
    Optional<Integer> findMaxMessageSequenceBySessionId(Long sessionId);
}
