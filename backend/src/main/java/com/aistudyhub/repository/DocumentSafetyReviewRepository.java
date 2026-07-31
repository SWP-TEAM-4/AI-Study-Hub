package com.aistudyhub.repository;

import com.aistudyhub.entity.DocumentSafetyReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DocumentSafetyReviewRepository
        extends JpaRepository<DocumentSafetyReview, Long>, JpaSpecificationExecutor<DocumentSafetyReview> {
}
