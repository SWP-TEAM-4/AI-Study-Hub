package com.aistudyhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aistudyhub.entity.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);

    Optional<Document> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

}
