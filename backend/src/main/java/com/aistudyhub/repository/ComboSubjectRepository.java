package com.aistudyhub.repository;

import com.aistudyhub.entity.ComboSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ComboSubjectRepository extends JpaRepository<ComboSubject, Long> {
    boolean existsByComboIdAndSubjectId(Long comboId, Long subjectId);
    Optional<ComboSubject> findByComboIdAndSubjectId(Long comboId, Long subjectId);
    List<ComboSubject> findByComboId(Long comboId);
    void deleteByComboIdAndSubjectId(Long comboId, Long subjectId);
}
