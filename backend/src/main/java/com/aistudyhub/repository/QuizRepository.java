package com.aistudyhub.repository;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.repository.projection.UserContributionStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long>, JpaSpecificationExecutor<Quiz> {

    Optional<Quiz> findFirstByCreatorIdAndClonedFrom_IdOrderByIdAsc(Long creatorId, Long clonedFromId);

    Page<Quiz> findByCreatorIdAndVisibilityAndMarketStatusOrderByUpdatedAtDesc(
            Long creatorId,
            Visibility visibility,
            MarketStatus marketStatus,
            Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"notebook", "subject", "creator", "academicTerm"})
    Page<Quiz> findAll(Specification<Quiz> spec, Pageable pageable);

    @Query("""
            SELECT q.creator.id AS userId,
                   COUNT(q.id) AS approvedContents,
                   COALESCE(SUM(q.downloadCount), 0) AS totalDownloads,
                   COALESCE(SUM(q.reviewCount), 0) AS totalReviewCount,
                   COALESCE(SUM(q.acceptPercentage), 0) AS totalAcceptPercentage
            FROM Quiz q
            WHERE q.visibility = :visibility
              AND q.marketStatus = :marketStatus
            GROUP BY q.creator.id
            """)
    List<UserContributionStatsProjection> summarizeApprovedContentByUser(
            @Param("visibility") Visibility visibility,
            @Param("marketStatus") MarketStatus marketStatus);
}
