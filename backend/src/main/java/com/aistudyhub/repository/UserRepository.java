package com.aistudyhub.repository;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Owner: BE1
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleIdAndType(String googleId, String type);

    boolean existsByEmail(String email);

    long countByRegistrationIp(String registrationIp);

    Optional<User> findByIdAndIsActiveTrue(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    java.util.List<User> findAllByIsActiveTrueAndRoleNot(Role role);

    java.util.List<User> findAllByRoleAndIsActiveTrue(Role role);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(CONCAT(COALESCE(u.fullName, ''), ' ', COALESCE(u.email, '')))
                    LIKE LOWER(CONCAT('%', COALESCE(:keyword, ''), '%'))
              AND (:role IS NULL OR u.role = :role)
              AND (:isActive IS NULL OR u.isActive = :isActive)
            """)
    Page<User> searchUsers(@Param("keyword") String keyword,
            @Param("role") Role role,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
