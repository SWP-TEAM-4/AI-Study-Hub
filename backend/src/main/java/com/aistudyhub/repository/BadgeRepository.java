package com.aistudyhub.repository;

import com.aistudyhub.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findAllByOrderByCreatedAtDescIdDesc();

    Optional<Badge> findFirstByNameIgnoreCaseOrderByIdAsc(String name);
}
