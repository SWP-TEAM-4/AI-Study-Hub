package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Đáp án (lựa chọn) của một câu hỏi Quiz.
 * Quan hệ: nhiều QuizOption thuộc một QuizQuestion (Many-to-One).
 * Owner: BE3
 */
@Entity
@Table(name = "quiz_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;
}
