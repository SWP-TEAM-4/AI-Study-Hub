package com.aistudyhub.repository;

import com.aistudyhub.entity.RegistrationVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Owner: BE1
 */
public interface RegistrationVerificationRepository extends JpaRepository<RegistrationVerification, Long> {

    Optional<RegistrationVerification> findByUserId(Long userId);

    Optional<RegistrationVerification> findByUser_Email(String email);

    @Modifying
    @Query("DELETE FROM RegistrationVerification rv WHERE rv.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
