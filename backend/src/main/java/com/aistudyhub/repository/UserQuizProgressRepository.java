package com.aistudyhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aistudyhub.entity.UserQuizProgress;

public interface UserQuizProgressRepository extends JpaRepository<UserQuizProgress, Long> {
    // Các phương thức truy vấn tùy chỉnh (nếu cần) sẽ được thêm vào đây.

    /**
     * Tìm kiếm câu trả lời của một câu hỏi cụ thể trong một bài test cụ thể.
     * Phục vụ cho logic "upsert" (nếu có rồi thì cập nhật, chưa có thì tạo mới).
     */
    Optional<UserQuizProgress> findByTestIdAndQuestionId(Long testId, Long questionId);

    /**
     * Kiểm tra câu hỏi đã được khóa vào lịch sử của bất kỳ bài test nào hay chưa.
     */
    boolean existsByQuestionId(Long questionId);

    /**
     * Lấy tất cả tiến trình của một bài test cụ thể (dùng khi chuẩn bị đáp án)
     */
    List<UserQuizProgress> findByTestIdOrderById(Long testId);
}
