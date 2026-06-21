package com.aistudyhub.repository;

import com.aistudyhub.entity.UserFlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/**
 * Repository xử lý các truy vấn liên quan đến tiến độ ôn tập của người dùng.
 * Owner: BE3 (Task BE-025)
 */
public interface UserFlashcardProgressRepository extends JpaRepository<UserFlashcardProgress, Long> {

    // Tìm kiếm tiến độ ôn tập của một User cụ thể đối với một thẻ Flashcard cụ thể
    Optional<UserFlashcardProgress> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    // Lấy toàn bộ tiến độ của một User đối với tất cả các thẻ nằm trong một bộ bài
    // (deck)
    List<UserFlashcardProgress> findByUserIdAndFlashcardDeckId(Long userId, Long deckId);
}