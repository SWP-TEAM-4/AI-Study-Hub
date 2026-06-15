package com.aistudyhub.repository;

import com.aistudyhub.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Owner: BE1 – RAG Core
 */
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);

    void deleteByDocumentId(Long documentId);

    long countByDocumentId(Long documentId);

    List<DocumentChunk> findByDocumentIdInOrderByDocumentIdAscChunkIndexAsc(List<Long> documentIds);
}
