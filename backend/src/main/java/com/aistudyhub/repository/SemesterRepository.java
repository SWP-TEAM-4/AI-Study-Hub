package com.aistudyhub.repository;

import com.aistudyhub.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Owner: BE2 – Academic module
 */
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    Optional<Semester> findByCode(String code);

    boolean existsByCode(String code);
}
