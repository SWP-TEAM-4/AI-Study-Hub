package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Thực thể đại diện cho bảng user_flashcard_progress.
 * Lưu trữ tiến độ học tập Leitner (Spaced Repetition) của từng User với từng
 * Flashcard.
 * Owner: BE3 (Task BE-025)
 */
@Entity
@Table(name = "user_flashcard_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "flashcard_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFlashcardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quan hệ với User học thẻ này
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Quan hệ với thẻ Flashcard cụ thể
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    // Cấp độ hộp Leitner (từ 1 đến 5), mặc định ban đầu là 1
    @Column(name = "box_level", nullable = false)
    @Builder.Default
    private Integer boxLevel = 1;

    // Thời gian ôn tập gần nhất
    @Column(name = "last_reviewed")
    private LocalDateTime lastReviewed;
}