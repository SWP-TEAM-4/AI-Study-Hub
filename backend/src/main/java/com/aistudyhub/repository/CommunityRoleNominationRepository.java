package com.aistudyhub.repository;

import com.aistudyhub.common.enums.CommunityRoleNominationStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.entity.CommunityRoleNomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CommunityRoleNominationRepository
        extends JpaRepository<CommunityRoleNomination, Long>, JpaSpecificationExecutor<CommunityRoleNomination> {

    boolean existsByUser_IdAndRoleTypeAndScopeTypeAndScopeIdAndPeriodKey(
            Long userId,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId,
            String periodKey);

    long countByStatus(CommunityRoleNominationStatus status);
}
