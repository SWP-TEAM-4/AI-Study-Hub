package com.aistudyhub.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.aistudyhub.entity.AiUsageLogs;

public interface AiUsageLogsRepository extends JpaRepository<AiUsageLogs, Long>, JpaSpecificationExecutor<AiUsageLogs> {
    List<AiUsageLogs> findByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndActionTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long userId,
            com.aistudyhub.common.enums.AiActionType actionType,
            LocalDateTime from,
            LocalDateTime to);

    long countByUser_IdAndActionTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long userId,
            Collection<com.aistudyhub.common.enums.AiActionType> actionTypes,
            LocalDateTime from,
            LocalDateTime to);
}
