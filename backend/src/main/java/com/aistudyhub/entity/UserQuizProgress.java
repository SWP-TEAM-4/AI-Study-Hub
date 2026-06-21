package com.aistudyhub.entity;
import java.time.LocalDateTime;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table (name = "user_quiz_progress", uniqueConstraints = {
    // Đảm bảo không lưu trùng lặp câu trả lời cho cùng một câu hỏi trong một bài test
    @UniqueConstraint(columnNames = {"test_id", "question_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class UserQuizProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;
    
    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    private QuizOption selectedOption; 

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "answered_at", updatable = false)
    private LocalDateTime answeredAt;

    @Column(name = "user_answer_text")
    private String userAnswerText;


    
}
