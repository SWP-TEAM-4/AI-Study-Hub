package com.aistudyhub.repository;

import com.aistudyhub.common.enums.SystemFeedbackStatus;
import com.aistudyhub.entity.SystemFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemFeedbackRepository extends JpaRepository<SystemFeedback, Long> {

    @Query("""
            SELECT feedback FROM SystemFeedback feedback
            WHERE feedback.user.id = :userId
            """)
    Page<SystemFeedback> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT feedback FROM SystemFeedback feedback
            WHERE (:keyword IS NULL
                   OR LOWER(feedback.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(feedback.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:status IS NULL OR feedback.status = :status)
            """)
    Page<SystemFeedback> searchFeedbacks(@Param("keyword") String keyword,
                                         @Param("status") SystemFeedbackStatus status,
                                         Pageable pageable);
}
