package com.aistudyhub.repository;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.entity.CommunityRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommunityRoleRepository extends JpaRepository<CommunityRole, Long> {

    @EntityGraph(attributePaths = {"user", "grantedBy"})
    @Query("""
            SELECT cr
            FROM CommunityRole cr
            JOIN cr.user u
            LEFT JOIN cr.grantedBy gb
            WHERE LOWER(CONCAT(COALESCE(u.fullName, ''), ' ', COALESCE(u.email, '')))
                    LIKE LOWER(CONCAT('%', COALESCE(:keyword, ''), '%'))
              AND (:userId IS NULL OR u.id = :userId)
              AND (:roleType IS NULL OR cr.roleType = :roleType)
              AND (:status IS NULL OR cr.status = :status)
              AND (:scopeType IS NULL OR cr.scopeType = :scopeType)
              AND (:scopeId IS NULL OR cr.scopeId = :scopeId)
            """)
    Page<CommunityRole> searchRoles(@Param("keyword") String keyword,
            @Param("userId") Long userId,
            @Param("roleType") CommunityRoleType roleType,
            @Param("status") CommunityRoleStatus status,
            @Param("scopeType") CommunityScopeType scopeType,
            @Param("scopeId") Long scopeId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"user", "grantedBy"})
    @Query("""
            SELECT cr
            FROM CommunityRole cr
            WHERE cr.user.id = :userId
              AND cr.status = :status
              AND (cr.startAt IS NULL OR cr.startAt <= :now)
              AND (cr.endAt IS NULL OR cr.endAt >= :now)
            ORDER BY cr.createdAt DESC
            """)
    List<CommunityRole> findCurrentRolesByUserId(@Param("userId") Long userId,
            @Param("status") CommunityRoleStatus status,
            @Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"user", "grantedBy"})
    @Query("""
            SELECT cr
            FROM CommunityRole cr
            WHERE cr.id = :id
            """)
    Optional<CommunityRole> findDetailedById(@Param("id") Long id);

    @Query("""
            SELECT cr
            FROM CommunityRole cr
            WHERE cr.user.id = :userId
              AND cr.roleType = :roleType
              AND cr.status = :status
              AND (cr.startAt IS NULL OR cr.startAt <= :now)
              AND (cr.endAt IS NULL OR cr.endAt >= :now)
            ORDER BY cr.createdAt DESC
            """)
    List<CommunityRole> findActiveRolesByUserIdAndRoleType(@Param("userId") Long userId,
            @Param("roleType") CommunityRoleType roleType,
            @Param("status") CommunityRoleStatus status,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT (COUNT(cr) > 0)
            FROM CommunityRole cr
            WHERE cr.user.id = :userId
              AND cr.roleType IN :roleTypes
              AND cr.status = :status
              AND (cr.startAt IS NULL OR cr.startAt <= :now)
              AND (cr.endAt IS NULL OR cr.endAt >= :now)
            """)
    boolean existsAnyActiveRoleByUserIdAndRoleTypes(@Param("userId") Long userId,
            @Param("roleTypes") Collection<CommunityRoleType> roleTypes,
            @Param("status") CommunityRoleStatus status,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT (COUNT(cr) > 0)
            FROM CommunityRole cr
            WHERE cr.user.id = :userId
              AND cr.roleType = :roleType
              AND ((:scopeType IS NULL AND cr.scopeType IS NULL) OR cr.scopeType = :scopeType)
              AND ((:scopeId IS NULL AND cr.scopeId IS NULL) OR cr.scopeId = :scopeId)
              AND cr.status = :status
              AND (cr.endAt IS NULL OR cr.endAt >= :now)
            """)
    boolean existsOverlappingActiveRole(@Param("userId") Long userId,
            @Param("roleType") CommunityRoleType roleType,
            @Param("scopeType") CommunityScopeType scopeType,
            @Param("scopeId") Long scopeId,
            @Param("status") CommunityRoleStatus status,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT COUNT(DISTINCT cr.user.id)
            FROM CommunityRole cr
            WHERE cr.user.id <> :ownerId
              AND cr.user.isActive = true
              AND cr.roleType IN :roleTypes
              AND cr.status = :status
              AND (cr.startAt IS NULL OR cr.startAt <= :now)
              AND (cr.endAt IS NULL OR cr.endAt >= :now)
              AND (cr.scopeType IS NULL OR cr.scopeType = com.aistudyhub.common.enums.CommunityScopeType.GLOBAL
                   OR (cr.scopeType = com.aistudyhub.common.enums.CommunityScopeType.SUBJECT AND cr.scopeId = :subjectId))
            """)
    long countEligibleSubjectReviewers(@Param("subjectId") Long subjectId,
            @Param("ownerId") Long ownerId,
            @Param("roleTypes") Collection<CommunityRoleType> roleTypes,
            @Param("status") CommunityRoleStatus status,
            @Param("now") LocalDateTime now);
}
