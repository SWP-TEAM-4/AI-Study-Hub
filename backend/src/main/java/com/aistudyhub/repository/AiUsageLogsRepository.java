package com.aistudyhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.aistudyhub.entity.AiUsageLogs;

public interface AiUsageLogsRepository extends JpaRepository<AiUsageLogs, Long>, JpaSpecificationExecutor<AiUsageLogs> {
    List<AiUsageLogs> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
