package com.aistudyhub.repository;

import com.aistudyhub.entity.DocumentShareLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentShareLinkRepository extends JpaRepository<DocumentShareLink, Long> {

    Optional<DocumentShareLink> findByDocumentId(Long documentId);

    Optional<DocumentShareLink> findByShareToken(String shareToken);

    boolean existsByShareToken(String shareToken);
}
