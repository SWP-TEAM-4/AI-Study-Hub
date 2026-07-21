package com.aistudyhub.repository;

import com.aistudyhub.entity.AiQuotaTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiQuotaTierRepository extends JpaRepository<AiQuotaTier, Long> {
    List<AiQuotaTier> findAllByOrderByMinReputationPointsAsc();
    List<AiQuotaTier> findAllByEnabledTrueOrderByMinReputationPointsAsc();
    Optional<AiQuotaTier> findFirstByEnabledTrueAndMinReputationPointsLessThanEqualOrderByMinReputationPointsDesc(Integer points);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsByMinReputationPointsAndIdNot(Integer minReputationPoints, Long id);
}
