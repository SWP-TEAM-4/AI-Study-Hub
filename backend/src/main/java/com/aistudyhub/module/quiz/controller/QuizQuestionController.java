package com.aistudyhub.module.quiz.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.quiz.dto.QuestionRequest;
import com.aistudyhub.module.quiz.dto.QuestionResponse;
import com.aistudyhub.module.quiz.service.QuizQuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cung cấp các REST API quản lý câu hỏi và đáp án trong Quiz Bank.
 * Yêu cầu xác thực Bearer Token.
 * Owner: BE3
 */
@Tag(name = "Quiz Questions", description = "Quản lý câu hỏi và đáp án trong Quiz Bank - BE3")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
public class QuizQuestionController {

    private final QuizQuestionService quizQuestionService;

    @Operation(
        summary = "Thêm câu hỏi vào một Quiz",
        description = """
            Thêm một câu hỏi kèm danh sách đáp án vào Quiz. Chỉ người tạo Quiz mới được phép.
            
            **Quy tắc:**
            - `SINGLE_CHOICE` / `MULTIPLE_CHOICE`: cần ít nhất 2 đáp án, ít nhất 1 `isCorrect: true`
            - `FILL_IN_THE_BLANK`: truyền đúng 1 option ẩn chứa đáp án chuẩn với `isCorrect: true`
            - Trường `id` trong options: **BỎ TRỐNG** khi tạo mới (chỉ dùng cho PUT)
            """
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        content = @Content(
            mediaType = "application/json",
            examples = {
                @ExampleObject(
                    name = "1. Trắc nghiệm 1 đáp án (SINGLE_CHOICE)",
                    summary = "Câu hỏi chọn 1 đáp án đúng",
                    value = """
                        {
                          "questionText": "Spring Boot là gì?",
                          "questionType": "SINGLE_CHOICE",
                          "explanation": "Spring Boot là framework Java giúp tạo ứng dụng nhanh chóng",
                          "options": [
                            { "optionText": "Một framework Java", "isCorrect": true },
                            { "optionText": "Một ngôn ngữ lập trình", "isCorrect": false },
                            { "optionText": "Một hệ quản trị cơ sở dữ liệu", "isCorrect": false }
                          ]
                        }
                        """
                ),
                @ExampleObject(
                    name = "2. Trắc nghiệm nhiều đáp án (MULTIPLE_CHOICE)",
                    summary = "Câu hỏi chọn nhiều đáp án đúng",
                    value = """
                        {
                          "questionText": "Những tính năng nào có trong Spring Boot?",
                          "questionType": "MULTIPLE_CHOICE",
                          "explanation": "Spring Boot hỗ trợ auto-configuration và embedded server",
                          "options": [
                            { "optionText": "Auto-configuration", "isCorrect": true },
                            { "optionText": "Embedded server (Tomcat)", "isCorrect": true },
                            { "optionText": "Tự viết HTML từ đầu", "isCorrect": false },
                            { "optionText": "Dependency injection", "isCorrect": true }
                          ]
                        }
                        """
                ),
                @ExampleObject(
                    name = "3. Điền vào chỗ trống (FILL_IN_THE_BLANK)",
                    summary = "Câu hỏi điền từ với một đáp án chuẩn ẩn",
                    value = """
                        {
                          "questionText": "Annotation để khai báo một Spring Bean là ______",
                          "questionType": "FILL_IN_THE_BLANK",
                          "explanation": "@Component hoặc @Service, @Repository, @Controller",
                          "options": [
                            { "optionText": "@Component", "isCorrect": true }
                          ]
                        }
                        """
                )
            }
        )
    )
    @PostMapping("/api/quizzes/{quizId}/questions")
    public ResponseEntity<ApiResponse<QuestionResponse>> addQuestion(
            @PathVariable Long quizId,
            @Valid @RequestBody QuestionRequest request) {
        QuestionResponse response = quizQuestionService.addQuestion(quizId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added successfully", response));
    }

    @Operation(
        summary = "Lấy danh sách câu hỏi của một Quiz",
        description = "Trả về toàn bộ câu hỏi và đáp án của Quiz. Quiz PRIVATE: chỉ người tạo mới xem được."
    )
    @GetMapping("/api/quizzes/{quizId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestions(
            @PathVariable Long quizId) {
        List<QuestionResponse> response = quizQuestionService.getQuestions(quizId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(
        summary = "Cập nhật câu hỏi và đáp án",
        description = """
            Cập nhật nội dung câu hỏi và đồng bộ danh sách đáp án. Chỉ người tạo Quiz mới được phép.
            
            **Cách xử lý options khi update:**
            - Option **có `id`** → cập nhật option đó
            - Option **không có `id`** → tạo option mới
            - Option cũ **không có trong request** → tự động xóa
            """
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        content = @Content(
            mediaType = "application/json",
            examples = {
                @ExampleObject(
                    name = "Cập nhật câu hỏi — sửa option cũ + thêm option mới",
                    summary = "id có giá trị = sửa, id null = tạo mới",
                    value = """
                        {
                          "questionText": "Spring Boot là gì? (đã sửa)",
                          "questionType": "SINGLE_CHOICE",
                          "explanation": "Giải thích đã được cập nhật",
                          "options": [
                            { "id": 1, "optionText": "Một framework Java (sửa lại)", "isCorrect": true },
                            { "id": 2, "optionText": "Một ngôn ngữ lập trình", "isCorrect": false },
                            { "optionText": "Option mới thêm vào (không có id)", "isCorrect": false }
                          ]
                        }
                        """
                )
            }
        )
    )
    @PutMapping("/api/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionRequest request) {
        QuestionResponse response = quizQuestionService.updateQuestion(questionId, request);
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", response));
    }

    @Operation(
        summary = "Xóa câu hỏi (cascade xóa đáp án)",
        description = "Xóa câu hỏi và tự động xóa toàn bộ đáp án liên quan. Chỉ người tạo Quiz mới được phép."
    )
    @DeleteMapping("/api/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long questionId) {
        quizQuestionService.deleteQuestion(questionId);
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully"));
    }
}
