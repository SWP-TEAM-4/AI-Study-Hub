package com.aistudyhub.repository;

import com.aistudyhub.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    /**
     * Lấy toàn bộ câu hỏi của một Quiz, sắp xếp theo id tăng dần để thứ tự ổn định.
     */
    @Query("SELECT q FROM QuizQuestion q WHERE q.quiz.id = :quizId AND q.deletedAt IS NULL ORDER BY q.id")
    List<QuizQuestion> findByQuizIdOrderById(@Param("quizId") Long quizId);

    @Query("SELECT q FROM QuizQuestion q WHERE q.id IN :questionIds AND q.deletedAt IS NULL")
    List<QuizQuestion> findAllActiveById(@Param("questionIds") List<Long> questionIds);

    Optional<QuizQuestion> findByIdAndDeletedAtIsNull(Long questionId);
}
