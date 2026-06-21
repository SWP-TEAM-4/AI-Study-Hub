package com.aistudyhub.repository;

import com.aistudyhub.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Owner: BE1
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Query("""
            SELECT n
            FROM Notification n
            WHERE n.user.id = :userId
              AND (:keyword IS NULL
                OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(n.content, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Notification> searchByUserId(@Param("userId") Long userId,
            @Param("keyword") String keyword,
            Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllReadByUserId(@Param("userId") Long userId);
}
