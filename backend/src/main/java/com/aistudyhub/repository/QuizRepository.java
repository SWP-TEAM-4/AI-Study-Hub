package com.aistudyhub.repository;

import com.aistudyhub.entity.Quiz;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    @Query("""
        SELECT q FROM Quiz q
        WHERE q.creator.id = :creatorId
          AND (:keyword IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(q.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:subjectId IS NULL OR q.subject.id = :subjectId)
          AND (:notebookId IS NULL OR q.notebook.id = :notebookId)
          AND (:academicTermId IS NULL OR q.academicTerm.id = :academicTermId)
          AND (:examType IS NULL OR LOWER(q.examType) = LOWER(:examType))
          AND (:visibility IS NULL OR q.visibility = :visibility)
          AND (:marketStatus IS NULL OR q.marketStatus = :marketStatus)
    """)
    Page<Quiz> searchMyQuizzes(
        @Param("creatorId") Long creatorId,
        @Param("keyword") String keyword,
        @Param("subjectId") Long subjectId,
        @Param("notebookId") Long notebookId,
        @Param("academicTermId") Long academicTermId,
        @Param("examType") String examType,
        @Param("visibility") Visibility visibility,
        @Param("marketStatus") MarketStatus marketStatus,
        Pageable pageable
    );
}
