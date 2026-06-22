package com.aistudyhub.repository;

import com.aistudyhub.entity.DocumentTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DocumentTagRepository extends JpaRepository<DocumentTag, Long> {
    boolean existsByDocumentIdAndTagId(Long documentId, Long tagId);

    Optional<DocumentTag> findByDocumentIdAndTagId(Long documentId, Long tagId);

    List<DocumentTag> findByDocumentId(Long documentId);

    @Query("""
                SELECT dt
                FROM DocumentTag dt
                JOIN FETCH dt.tag
                WHERE dt.document.id IN :documentIds
            """)
    List<DocumentTag> findAllByDocumentIdInWithTag(
            @Param("documentIds") Collection<Long> documentIds);
}
