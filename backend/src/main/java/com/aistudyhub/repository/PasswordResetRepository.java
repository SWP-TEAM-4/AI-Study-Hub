package com.aistudyhub.repository;

import com.aistudyhub.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Owner: BE1
 */
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {

    Optional<PasswordReset> findByResetToken(String resetToken);

    @Modifying
    @Query("DELETE FROM PasswordReset pr WHERE pr.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
