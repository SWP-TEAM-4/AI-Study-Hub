package com.aistudyhub.repository;

import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Flashcard;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByDeckIdOrderById(Long deckId);

    @Query("SELECT f FROM Flashcard f " +
            "LEFT JOIN UserFlashcardProgress p ON p.flashcard.id = f.id AND p.user.id = :userId " +
            "WHERE (f.deck.user.id = :userId OR f.deck.visibility IN :visibilities) AND " +
            "  (:deckId IS NULL OR f.deck.id = :deckId) AND (" +
            "  p.id IS NULL OR " +
            "  (p.boxLevel = 1 AND p.lastReviewed <= :cutoff1) OR " +
            "  (p.boxLevel = 2 AND p.lastReviewed <= :cutoff2) OR " +
            "  (p.boxLevel = 3 AND p.lastReviewed <= :cutoff3) OR " +
            "  (p.boxLevel = 4 AND p.lastReviewed <= :cutoff4) OR " +
            "  (p.boxLevel = 5 AND p.lastReviewed <= :cutoff5)" +
            ")")
    List<Flashcard> findDueCards(
            @Param("userId") Long userId,
            @Param("visibilities") Collection<Visibility> visibilities,
            @Param("deckId") Long deckId,
            @Param("cutoff1") LocalDateTime cutoff1,
            @Param("cutoff2") LocalDateTime cutoff2,
            @Param("cutoff3") LocalDateTime cutoff3,
            @Param("cutoff4") LocalDateTime cutoff4,
            @Param("cutoff5") LocalDateTime cutoff5);
}
