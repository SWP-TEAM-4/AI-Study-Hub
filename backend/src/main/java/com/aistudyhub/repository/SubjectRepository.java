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

    List<Subject> findAllByOrderByCodeAsc();

    List<Subject> findByStandardSemesterNumberOrderByCodeAsc(Integer semester);

    @Query("""
            SELECT s FROM Subject s
            WHERE LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY s.code ASC
            """)
    List<Subject> searchByKeyword(@Param("keyword") String keyword);

    @Query("""
            SELECT s FROM Subject s
            WHERE (LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND s.standardSemesterNumber = :semester
            ORDER BY s.code ASC
            """)
    List<Subject> searchByKeywordAndSemester(
            @Param("keyword") String keyword,
            @Param("semester") Integer semester);
}
