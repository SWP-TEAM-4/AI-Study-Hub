package com.aistudyhub.repository;

import com.aistudyhub.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Owner: BE2 – Academic module
 */
public interface ComboRepository extends JpaRepository<Combo, Long> {

    Optional<Combo> findByCode(String code);

    boolean existsByCode(String code);
}
