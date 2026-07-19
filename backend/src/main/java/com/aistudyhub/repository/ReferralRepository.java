package com.aistudyhub.repository;

import com.aistudyhub.common.enums.ReferralStatus;
import com.aistudyhub.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReferralRepository extends JpaRepository<Referral, Long> {

    Optional<Referral> findByOwner_Id(Long ownerId);

    Optional<Referral> findByCode(String code);

    boolean existsByCode(String code);

    long countByAppliedReferral_Owner_IdAndStatus(Long ownerId, ReferralStatus status);
}
