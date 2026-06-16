package com.aistudyhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {
     List<Document> findByUserId(Long userId);

     Optional<Document> findByIdAndUserId(Long id, Long userId);

     boolean existsByIdAndUserId(
               Long id,
               Long userId);

     @Query("""
                   SELECT d
                   FROM Document d
                   WHERE d.user.id = :userId
                   AND (:keyword IS NULL
                        OR LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
                   AND (:subjectId IS NULL
                        OR d.subject.id = :subjectId)
                   AND (:fileType IS NULL
                        OR d.fileType = :fileType)
                   AND (:visibility IS NULL
                        OR d.visibility = :visibility)
                   AND (:processingStatus IS NULL
                        OR d.processingStatus = :processingStatus)
               """)
     List<Document> searchDocuments(
               @Param("userId") Long userId,
               @Param("keyword") String keyword,
               @Param("subjectId") Long subjectId,
               @Param("fileType") String fileType,
               @Param("visibility") Visibility visibility,
               @Param("processingStatus") ProcessingStatus processingStatus);
}
