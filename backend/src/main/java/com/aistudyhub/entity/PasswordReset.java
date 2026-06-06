package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Owner: BE1 – Auth module (forgot/reset password)
 */
@Entity
@Table(name = "password_resets", indexes = {
        @Index(name = "idx_password_resets_token", columnList = "reset_token"),
        @Index(name = "idx_password_resets_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordReset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reset_token", nullable = false, length = 255)
    private String resetToken;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;
}
