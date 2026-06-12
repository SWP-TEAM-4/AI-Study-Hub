package com.aistudyhub.repository;

import com.aistudyhub.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    /**
     * Lấy toàn bộ câu hỏi của một Quiz, sắp xếp theo id tăng dần để thứ tự ổn định.
     */
    List<QuizQuestion> findByQuizIdOrderById(Long quizId);
}
