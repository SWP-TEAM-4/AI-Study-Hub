package com.aistudyhub.module.quiz.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.quiz.dto.AnswerRequest;
import com.aistudyhub.module.quiz.dto.StartTestRequest;
import com.aistudyhub.module.quiz.dto.TestResponse;
import com.aistudyhub.module.quiz.dto.UserAnswerResponse;
import com.aistudyhub.module.quiz.service.TestService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller cung cấp các REST API bắt đầu thi, làm bài và lưu tiến trình của
 * bài test.
 * Yêu cầu xác thực Bearer Token để thực thi.
 * Owner: BE3
 */
@RestController
@Tag(name = "Test Attempt", description = "Quản lý lượt thi và lưu tiến trình câu trả lời - BE3")
@SecurityRequirement(name = "Bearer Authentication")
@RequiredArgsConstructor
public class TestController {
    private final TestService testService;

    /**
     * API bắt đầu làm bài test (tạo lượt thi mới) từ một Quiz cụ thể.
     * <p>
     * Hệ thống sẽ kiểm tra quyền sở hữu đối với các Quiz ở trạng thái PRIVATE
     * và khởi tạo đề thi dựa trên chế độ chọn câu hỏi (ALL, SELECTED, RANDOM).
     * 
     * @param quizId  ID của Quiz cần làm bài test
     * @param request cấu hình lượt thi (tiêu đề, thời gian làm bài, cách bốc câu
     *                hỏi, trộn đề...)
     * @return ResponseEntity chứa thông tin bài test và danh sách các câu hỏi đi
     *         kèm
     */
    @Operation(summary = "Bắt đầu làm bài test (Tạo lượt thi)")
    @PostMapping("/api/quizzes/{quizId}/tests")
    public ResponseEntity<ApiResponse<TestResponse>> startTest(
            @PathVariable Long quizId,
            @Valid @RequestBody StartTestRequest request) {

        // Bước A: Gọi Service xử lý nghiệp vụ và nhận về kết quả (đã làm ở trên)
        TestResponse response = testService.startTest(quizId, request);

        // Bước B: Bọc kết quả vào hộp "ApiResponse" chuẩn của dự án kèm lời nhắn thành
        // công
        ApiResponse<TestResponse> apiResult = ApiResponse.success("Test started successfully", response);

        // Bước C: Trả về Client với mã HTTP Status là 201 Created và nhét hộp apiResult
        // vào Body
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResult);

    }

    /**
     * API xem chi tiết tiến trình bài test đang làm (Resuming).
     * <p>
     * Trả về toàn bộ thông tin cấu hình lượt thi cùng danh sách câu hỏi
     * và trạng thái đáp án mà học sinh đã chọn trước đó (nếu có).
     * 
     * @param testId ID của lượt làm bài test cần xem chi tiết
     * @return ResponseEntity chứa thông tin tiến trình lượt làm bài
     */
    @Operation(summary = "Xem chi tiết tiến trình bài test đang làm (Resuming)")
    @GetMapping("/api/tests/{testId}")
    public ResponseEntity<ApiResponse<TestResponse>> getTest(
            @PathVariable Long testId) {

        // Bước A: Gọi Service lấy thông tin bài test và câu trả lời cũ
        TestResponse response = testService.getTest(testId);

        // Bước B: Bọc dữ liệu vào ApiResponse chuẩn
        ApiResponse<TestResponse> apiResult = ApiResponse.success("Get test progress successfully", response);

        // Bước C: Trả về Client với mã HTTP Status 200 OK
        // return ResponseEntity.status(HttpStatus.OK).body(apiResult);
        // hoặcc tương đương
        return ResponseEntity.ok(apiResult);
    }

    /**
     * API lưu / cập nhật câu trả lời của học sinh cho một câu hỏi cụ thể
     * (Auto-save).
     * <p>
     * Dữ liệu gửi lên sẽ được chấm điểm đúng/sai trực tiếp và lưu âm thầm vào DB.
     * Trả về kết quả đã lưu mà không để lộ trường isCorrect để tránh gian lận.
     * 
     * @param testId  ID của bài test đang làm
     * @param request thông tin câu trả lời (questionId, selectedOptionId hoặc
     *                userAnswerText)
     * @return ResponseEntity chứa thông tin câu trả lời đã được ghi nhận thành công
     */
    @Operation(summary = "Lưu/Cập nhật câu trả lời của 1 câu hỏi (Auto save)")
    @PostMapping("/api/tests/{testId}/answers")
    public ResponseEntity<ApiResponse<UserAnswerResponse>> submitAnswer(
            @PathVariable Long testId,
            @Valid @RequestBody AnswerRequest request) {

        // Bước A: Gọi Service xử lý nghiệp vụ và nhận về kết quả (đã làm ở trên)
        UserAnswerResponse response = testService.submitAnswer(testId, request);

        // Bước B: Bọc kết quả vào ApiResponse chuẩn
        ApiResponse<UserAnswerResponse> apiResult = ApiResponse.success("Success", response);

        // Bước C: Trả về Client với mã HTTP Status 200 OK
        return ResponseEntity.status(HttpStatus.OK).body(apiResult);

    }

}
