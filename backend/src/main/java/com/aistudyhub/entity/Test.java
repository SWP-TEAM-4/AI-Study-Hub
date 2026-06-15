package com.aistudyhub.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aistudyhub.common.enums.TestStatus;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title")
    private String title;

    @Column(name = "total_score")
    private BigDecimal totalScore;

    @Enumerated(EnumType.STRING)
    private TestStatus status; // IN_PROGRESS, COMPLETED

    @Column(name = "duration")
    private Integer duration;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

}
