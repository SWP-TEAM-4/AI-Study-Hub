package com.aistudyhub.repository;

import com.aistudyhub.common.enums.SystemFeedbackStatus;
import com.aistudyhub.entity.SystemFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemFeedbackRepository extends JpaRepository<SystemFeedback, Long> {

    @EntityGraph(attributePaths = "user")
    @Query("""
            SELECT sf
            FROM SystemFeedback sf
            LEFT JOIN sf.user u
            WHERE (:status IS NULL OR sf.status = :status)
              AND (:keyword IS NULL
                OR LOWER(sf.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(sf.content, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(sf.screenUrl, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<SystemFeedback> searchFeedbacks(@Param("keyword") String keyword,
            @Param("status") SystemFeedbackStatus status,
            Pageable pageable);
}
