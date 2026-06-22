package com.aistudyhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aistudyhub.entity.AiUsageLogs;

public interface AiUsageLogsRepository extends JpaRepository<AiUsageLogs, Long> {
    List<AiUsageLogs> findByUserId(long userId);

}
