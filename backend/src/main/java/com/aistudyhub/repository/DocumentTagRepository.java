package com.aistudyhub.repository;

import com.aistudyhub.entity.DocumentTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentTagRepository extends JpaRepository<DocumentTag, Long> {
    boolean existsByDocumentIdAndTagId(Long documentId, Long tagId);
    Optional<DocumentTag> findByDocumentIdAndTagId(Long documentId, Long tagId);
    List<DocumentTag> findByDocumentId(Long documentId);
}
