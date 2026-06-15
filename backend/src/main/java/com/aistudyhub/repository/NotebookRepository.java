package com.aistudyhub.repository;

import com.aistudyhub.entity.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface NotebookRepository extends JpaRepository<Notebook, Long> {
    List<Notebook> findByUserId(Long userId);

    Optional<Notebook> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
