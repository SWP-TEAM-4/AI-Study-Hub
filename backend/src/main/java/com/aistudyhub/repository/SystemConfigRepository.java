package com.aistudyhub.repository;

import com.aistudyhub.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Owner: BE1
 */
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    List<SystemConfig> findAllByOrderByConfigKeyAsc();

    List<SystemConfig> findAllByIsPublicTrueOrderByConfigKeyAsc();

    Optional<SystemConfig> findByConfigKey(String configKey);

    boolean existsByConfigKey(String configKey);

    boolean existsByConfigKeyAndIdNot(String configKey, Long id);
}
