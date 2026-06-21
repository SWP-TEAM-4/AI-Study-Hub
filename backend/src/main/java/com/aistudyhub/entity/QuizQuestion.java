package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import com.aistudyhub.common.enums.QuestionType;

import java.util.ArrayList;
import java.util.List;

/**
 * Câu hỏi trong một Quiz.
 * Quan hệ: nhiều QuizQuestion thuộc một Quiz (Many-to-One).
 * Quan hệ: một QuizQuestion có nhiều QuizOption (One-to-Many, cascade ALL).
 * Owner: BE3
 */
@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 50)
    private QuestionType questionType;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    /**
     * Danh sách đáp án của câu hỏi.
     * cascade = ALL: mọi thao tác (save, merge, delete) trên Question đều áp dụng xuống Option.
     * orphanRemoval = true: Option bị gỡ khỏi danh sách này sẽ tự động bị xóa khỏi DB.
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizOption> options = new ArrayList<>();
}
