package com.aistudyhub.repository;

import com.aistudyhub.entity.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotebookRepository extends JpaRepository<Notebook, Long> {
    Optional<Notebook> findByIdAndUserId(Long id, Long userId);
}
