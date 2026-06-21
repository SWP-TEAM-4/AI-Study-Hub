package com.aistudyhub.module.quiz.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.aistudyhub.common.enums.TestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO đại diện cho một bản ghi lượt thi trong lịch sử làm bài của người dùng.
 * Được tinh gọn tối đa (không kèm câu hỏi chi tiết) để tối ưu băng thông khi
 * tải trang danh sách.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTestHistoryResponse {

    private Long id;
    private Long quizId;

    // ID của học sinh thực hiện bài thi
    private Long userId;

    // Tiêu đề của lượt thi (Ví dụ: "Attempt 1 - SWR302 Quiz")
    private String title;

    // Điểm số của lượt thi (null nếu trạng thái là IN_PROGRESS và chưa nộp bài)
    private BigDecimal totalScore;

    // Thời gian làm bài thi (theo phút)
    private Integer duration;

    // Trạng thái lượt làm bài (IN_PROGRESS hoặc COMPLETED)
    private TestStatus status;

    // Thời gian bắt đầu làm bài thi
    private LocalDateTime createdAt;
}