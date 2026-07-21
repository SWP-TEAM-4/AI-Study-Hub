package com.aistudyhub.entity;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể đại diện cho bảng flashcard_decks.
 * Owner: BE3 (Task BE-024)
 */
@Entity
@Table(name = "flashcard_decks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notebook_id")
    private Notebook notebook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Visibility visibility = Visibility.PRIVATE;

    @Enumerated(EnumType.STRING)
    @Column(name = "market_status", nullable = false, length = 50)
    @Builder.Default
    private MarketStatus marketStatus = MarketStatus.NONE;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "accept_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal acceptPercentage = BigDecimal.ZERO;

    @Column(name = "community_review_count", nullable = false)
    @Builder.Default
    private Integer communityReviewCount = 0;

    @Column(name = "community_rating_avg", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal communityRatingAvg = BigDecimal.ZERO;

    @Column(name = "ai_verdict_note", columnDefinition = "TEXT")
    private String aiVerdictNote;

    @Column(name = "submit_note", columnDefinition = "TEXT")
    private String submitNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloned_from_id")
    private FlashcardDeck clonedFrom;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Danh sách thẻ nhớ thuộc bộ bài này.
     * cascade = ALL: Khi lưu/xóa Deck sẽ tự động áp dụng xuống Card.
     * orphanRemoval = true: Khi xóa Card khỏi danh sách, Hibernate tự động delete Card đó dưới DB.
     */
    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Flashcard> cards = new ArrayList<>();
}
