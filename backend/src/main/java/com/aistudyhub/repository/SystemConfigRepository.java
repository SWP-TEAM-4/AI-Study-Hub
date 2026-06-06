package com.aistudyhub.repository;

import com.aistudyhub.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Owner: BE1
 */
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    Optional<SystemConfig> findByConfigKey(String configKey);

    boolean existsByConfigKey(String configKey);
}
