package com.aistudyhub.repository;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Document;
import com.aistudyhub.repository.projection.UserContributionStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Owner: BE2 (skeleton by BE1 to unblock BE-016)
 */
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    Optional<Document> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndClonedFromId(Long userId, Long clonedFromId);


    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Document> findByProcessingStatus(ProcessingStatus status);

    @Query("""
            SELECT d.user.id AS userId,
                   COUNT(d.id) AS approvedContents,
                   COALESCE(SUM(d.downloadCount), 0) AS totalDownloads,
                   COALESCE(SUM(d.reviewCount), 0) AS totalReviewCount,
                   COALESCE(SUM(d.acceptPercentage), 0) AS totalAcceptPercentage
            FROM Document d
            WHERE d.visibility = :visibility
              AND d.marketStatus = :marketStatus
            GROUP BY d.user.id
            """)
    List<UserContributionStatsProjection> summarizeApprovedContentByUser(
            @Param("visibility") Visibility visibility,
            @Param("marketStatus") MarketStatus marketStatus);
}
