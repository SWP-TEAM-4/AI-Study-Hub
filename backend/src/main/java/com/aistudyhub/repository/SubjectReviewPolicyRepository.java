package com.aistudyhub.repository;

import com.aistudyhub.entity.SubjectReviewPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubjectReviewPolicyRepository extends JpaRepository<SubjectReviewPolicy, Long> {
    Optional<SubjectReviewPolicy> findBySubjectIdAndEnabledTrue(Long subjectId);
    Optional<SubjectReviewPolicy> findBySubjectId(Long subjectId);
}
