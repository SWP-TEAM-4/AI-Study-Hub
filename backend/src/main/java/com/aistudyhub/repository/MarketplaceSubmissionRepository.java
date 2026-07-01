package com.aistudyhub.repository;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.entity.MarketplaceSubmission;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MarketplaceSubmissionRepository extends JpaRepository<MarketplaceSubmission, Long> {
    Optional<MarketplaceSubmission> findFirstByTargetTypeAndTargetIdOrderBySubmissionRoundDesc(String targetType, Long targetId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from MarketplaceSubmission s where s.id = :id")
    Optional<MarketplaceSubmission> findByIdForUpdate(@Param("id") Long id);

    Optional<MarketplaceSubmission> findFirstByTargetTypeAndTargetIdAndStatusOrderBySubmissionRoundDesc(
            String targetType, Long targetId, MarketStatus status);
}
