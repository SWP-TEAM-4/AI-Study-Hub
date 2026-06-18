package com.aistudyhub.module.quiz.dto;

import java.math.BigDecimal;
import java.util.List;

import com.aistudyhub.common.enums.TestStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/***
 * DTO trả về kết quả thi chi tiết sau khi nộp bài hoawjc khi xem lại kết quả.
 * Bao gồm các thông số tổng kết điểm, trạng thái bài thi và mảng danh sách câu
 * trả lời
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResultResponse {

    private Long testId;
    private Long quizId;
    private BigDecimal totalScore;
    private Integer correctAnswers;
    private Integer totalQuestions;

    // trạng thái bài thi(sẽ luôn là COMPLETE khi xem điểm hoặc nộp bài thành công)
    private TestStatus status;
    // Danh sách câu trả lời chi tiết của từng câu hỏi để hiển thị đáp án đúng/sai
    private List<TestResultItemResponse> items;

}
