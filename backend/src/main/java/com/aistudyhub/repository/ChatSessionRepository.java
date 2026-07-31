package com.aistudyhub.repository;

import com.aistudyhub.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * Owner: BE1 – Chat/RAG core
 */
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long>, JpaSpecificationExecutor<ChatSession> {

    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);

    Page<ChatSession> findByNotebookIdAndUserId(Long notebookId, Long userId, Pageable pageable);
}
