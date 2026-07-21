package com.aistudyhub.repository;

import com.aistudyhub.common.enums.TestStatus;
import com.aistudyhub.entity.Test;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface TestRepository extends JpaRepository<Test, Long> {

    /**
     * Lấy danh sách bài thi phân trang của một User cụ thể.
     * Sử dụng khi người dùng xem toàn bộ lịch sử thi (không tìm kiếm theo từ khóa).
     *
     * @param userId   ID của người dùng cần lấy lịch sử
     * @param pageable đối tượng phân trang (chứa trang hiện tại, số lượng
     *                 dòng/trang, và cách sắp xếp)
     * @return Page<Test> chứa danh sách các lượt thi
     */
    Page<Test> findByUserId(Long userId, Pageable pageable);

    /**
     * Tìm kiếm bài thi theo tiêu đề (Title) có chứa từ khóa và phân trang của User
     * cụ thể.
     * "Containing": Tương đương điều kiện LIKE %keyword% trong SQL.
     * "IgnoreCase": Tìm kiếm không phân biệt chữ hoa, chữ thường.
     *
     * @param userId   ID của người dùng
     * @param title    từ khóa cần tìm kiếm trong tiêu đề bài thi (ví dụ: "SWR302")
     * @param pageable đối tượng phân trang
     * @return Page<Test> chứa danh sách lượt thi phù hợp từ khóa
     */
    Page<Test> findByUserIdAndTitleContainingIgnoreCase(Long userId, String title, Pageable pageable);

    Page<Test> findByUserIdAndQuizId(Long userId, Long quizId, Pageable pageable);

    Page<Test> findByUserIdAndQuizIdAndTitleContainingIgnoreCase(Long userId, Long quizId, String title,
            Pageable pageable);

    Page<Test> findByUserIdAndQuizIdAndStatus(Long userId, Long quizId, TestStatus status, Pageable pageable);

    Page<Test> findByUserIdAndQuizIdAndTitleContainingIgnoreCaseAndStatus(Long userId, Long quizId, String title,
            TestStatus status, Pageable pageable);

    @Query("""
            SELECT t.quiz.id AS quizId, COUNT(t.id) AS attemptCount, MAX(t.totalScore) AS bestScore
            FROM Test t
            WHERE t.user.id = :userId
              AND t.quiz.id IN :quizIds
              AND t.status = :status
            GROUP BY t.quiz.id
            """)
    List<UserQuizTestSummary> summarizeUserTestsByQuizIds(
            @Param("userId") Long userId,
            @Param("quizIds") List<Long> quizIds,
            @Param("status") TestStatus status);

    interface UserQuizTestSummary {
        Long getQuizId();

        Long getAttemptCount();

        BigDecimal getBestScore();
    }
}
