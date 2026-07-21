package com.aistudyhub.repository;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.entity.RewardRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RewardRuleRepository extends JpaRepository<RewardRule, Long> {
    Optional<RewardRule> findByEventType(ReputationEventType eventType);
    List<RewardRule> findAllByOrderByEventTypeAsc();
}
