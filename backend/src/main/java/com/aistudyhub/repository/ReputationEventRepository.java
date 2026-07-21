package com.aistudyhub.repository;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.entity.ReputationEvent;
import com.aistudyhub.repository.projection.ReputationLeaderboardProjection;
import com.aistudyhub.repository.projection.UserTopSubjectProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReputationEventRepository extends JpaRepository<ReputationEvent, Long> {

    Optional<ReputationEvent> findByIdempotencyKey(String idempotencyKey);

    Page<ReputationEvent> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUser_IdAndEventTypeAndPeriodKey(Long userId, ReputationEventType eventType, String periodKey);

    List<ReputationEvent> findBySourceTypeAndSourceIdOrderByCreatedAtAsc(String sourceType, Long sourceId);

    @Query("""
            SELECT COALESCE(SUM(event.pointsDelta), 0)
            FROM ReputationEvent event
            WHERE event.user.id = :userId
            """)
    Long sumPointsByUserId(@Param("userId") Long userId);

    @Query(value = """
            SELECT event.user.id AS userId,
                   event.user.fullName AS fullName,
                   event.user.avatarUrl AS avatarUrl,
                   COALESCE(SUM(event.pointsDelta), 0) AS score,
                   COUNT(event.id) AS eventCount
            FROM ReputationEvent event
            WHERE (:subjectId IS NULL OR event.subject.id = :subjectId)
              AND (:periodKey IS NULL OR event.periodKey = :periodKey)
              AND event.eventType IN :eventTypes
            GROUP BY event.user.id, event.user.fullName, event.user.avatarUrl
            HAVING COALESCE(SUM(event.pointsDelta), 0) <> 0
            ORDER BY COALESCE(SUM(event.pointsDelta), 0) DESC, COUNT(event.id) DESC, event.user.id ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT event.user.id)
            FROM ReputationEvent event
            WHERE (:subjectId IS NULL OR event.subject.id = :subjectId)
              AND (:periodKey IS NULL OR event.periodKey = :periodKey)
              AND event.eventType IN :eventTypes
            """)
    Page<ReputationLeaderboardProjection> findLeaderboard(
            @Param("subjectId") Long subjectId,
            @Param("periodKey") String periodKey,
            @Param("eventTypes") Collection<ReputationEventType> eventTypes,
            Pageable pageable);

    @Query(value = """
            SELECT event.subject.id AS subjectId,
                   event.subject.code AS subjectCode,
                   event.subject.name AS subjectName,
                   COALESCE(SUM(event.pointsDelta), 0) AS score,
                   COUNT(event.id) AS eventCount
            FROM ReputationEvent event
            WHERE event.user.id = :userId
              AND event.subject IS NOT NULL
            GROUP BY event.subject.id, event.subject.code, event.subject.name
            HAVING COALESCE(SUM(event.pointsDelta), 0) <> 0
            ORDER BY COALESCE(SUM(event.pointsDelta), 0) DESC, COUNT(event.id) DESC, event.subject.code ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT event.subject.id)
            FROM ReputationEvent event
            WHERE event.user.id = :userId
              AND event.subject IS NOT NULL
            """)
    Page<UserTopSubjectProjection> findTopSubjectsByUserId(
            @Param("userId") Long userId,
            Pageable pageable);
}
