package com.aistudyhub.repository;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.repository.projection.UserContributionStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FlashcardDeckRepository
                extends JpaRepository<FlashcardDeck, Long>, JpaSpecificationExecutor<FlashcardDeck> {

        boolean existsByUserIdAndClonedFromId(Long userId, Long clonedFromId);


        @Query("""
                        SELECT f.user.id AS userId,
                               COUNT(f.id) AS approvedContents,
                               COALESCE(SUM(f.downloadCount), 0) AS totalDownloads,
                               COALESCE(SUM(f.reviewCount), 0) AS totalReviewCount,
                               COALESCE(SUM(f.acceptPercentage), 0) AS totalAcceptPercentage
                        FROM FlashcardDeck f
                        WHERE f.visibility = :visibility
                          AND f.marketStatus = :marketStatus
                        GROUP BY f.user.id
                        """)
        List<UserContributionStatsProjection> summarizeApprovedContentByUser(
                        @Param("visibility") Visibility visibility,
                        @Param("marketStatus") MarketStatus marketStatus);
}
