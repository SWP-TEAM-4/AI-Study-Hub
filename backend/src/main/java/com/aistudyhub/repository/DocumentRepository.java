package com.aistudyhub.repository;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

/**
 * Owner: BE2 (skeleton by BE1 to unblock BE-016)
 */
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    Optional<Document> findByIdAndUserId(Long id, Long userId);

    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Document> findByProcessingStatus(ProcessingStatus status);
}
