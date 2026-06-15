package com.aistudyhub.repository;

import com.aistudyhub.entity.Subject;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
            SELECT s FROM Subject s
            WHERE
            (:keyword IS NULL
                OR LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))

            )
                AND (:semester IS NULL
                OR  s.standardSemesterNumber = :semester)

            """)
    List<Subject> searchSubjects(@Param("keyword") String keyword, @Param("semester") Integer semester);
}
