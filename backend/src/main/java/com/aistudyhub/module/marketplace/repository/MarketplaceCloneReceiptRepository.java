package com.aistudyhub.module.marketplace.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aistudyhub.module.marketplace.entity.MarketplaceCloneReceipt;
import com.aistudyhub.module.marketplace.model.MarketplaceCloneTargetType;

public interface MarketplaceCloneReceiptRepository extends JpaRepository<MarketplaceCloneReceipt, Long> {

    Optional<MarketplaceCloneReceipt> findByUserIdAndTargetTypeAndSourceId(
            Long userId,
            MarketplaceCloneTargetType targetType,
            Long sourceId);
}
