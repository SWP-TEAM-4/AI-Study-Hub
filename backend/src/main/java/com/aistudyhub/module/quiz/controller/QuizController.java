package com.aistudyhub.module.quiz.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.quiz.dto.QuizRequest;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.quiz.dto.QuizSearchRequest;
import com.aistudyhub.module.quiz.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cung cấp các REST API quản lý và tìm kiếm ngân hàng đề thi cá nhân (Quiz Bank).
 * Yêu cầu xác thực Bearer Token để thực thi.
 * Owner: BE3
 */
@Tag(name = "Quiz Bank", description = "Quản lý ngân hàng đề thi cá nhân (Quiz Bank) - BE3")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /**
     * API tạo mới một Quiz trong cơ sở dữ liệu.
     * <p>
     * Cung cấp tiêu đề, mô tả, và có thể gắn kèm notebookId hoặc subjectId của người dùng.
     * 
     * @param request thông tin Quiz cần tạo
     * @return ResponseEntity chứa thông tin Quiz sau khi tạo thành công và mã HTTP 201 Created
     */
    @Operation(summary = "Tạo một Quiz mới")
    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(@Valid @RequestBody QuizRequest request) {
        QuizResponse response = quizService.createQuiz(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Quiz created successfully", response));
    }

    /**
     * API xem chi tiết cấu hình và metadata của một Quiz dựa trên ID.
     * <p>
     * Hệ thống tự động kiểm tra quyền sở hữu đối với các Quiz ở trạng thái PRIVATE.
     * 
     * @param id ID của Quiz cần truy vấn
     * @return ResponseEntity chứa thông tin Quiz và mã HTTP 200 OK
     */
    @Operation(summary = "Xem chi tiết một Quiz")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable Long id) {
        QuizResponse response = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * API cập nhật metadata của Quiz (Tiêu đề, mô tả, môn học, học kỳ, notebook liên kết...).
     * <p>
     * Chỉ người tạo (creator) mới được phép thực hiện hành động này.
     * 
     * @param id ID của Quiz cần cập nhật
     * @param request dữ liệu cập nhật mới
     * @return ResponseEntity chứa thông tin Quiz sau khi cập nhật thành công và mã HTTP 200 OK
     */
    @Operation(summary = "Cập nhật metadata của Quiz")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody QuizRequest request) {
        QuizResponse response = quizService.updateQuiz(id, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", response));
    }

    /**
     * API xóa hoàn toàn một Quiz dựa trên ID.
     * <p>
     * Chỉ người tạo (creator) mới được phép thực hiện hành động này.
     * 
     * @param id ID của Quiz cần xóa
     * @return ResponseEntity thông báo xóa thành công và mã HTTP 200 OK
     */
    @Operation(summary = "Xóa một Quiz")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully"));
    }

    /**
     * API lấy danh sách, tìm kiếm và lọc phân trang các Quiz do chính người dùng hiện tại sở hữu.
     * <p>
     * Hỗ trợ tìm kiếm theo keyword và lọc theo subjectId, notebookId, academicTermId,
     * examType, visibility, marketStatus, kèm theo cấu hình sắp xếp động.
     * Dùng @RequestParam riêng lẻ để tránh lỗi enum-binding của @ModelAttribute.
     */
    @Operation(summary = "Tìm kiếm và lọc danh sách Quiz cá nhân nâng cao (Query Params)")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<QuizResponse>>> searchMyQuizzes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long notebookId,
            @RequestParam(required = false) Long academicTermId,
            @RequestParam(required = false) String examType,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String marketStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        // Parse enum an toàn – tránh IllegalArgumentException → 500
        Visibility visibilityEnum = null;
        if (visibility != null && !visibility.isBlank()) {
            try {
                visibilityEnum = Visibility.valueOf(visibility.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid visibility value: " + visibility, "VALIDATION_ERROR"));
            }
        }

        MarketStatus marketStatusEnum = null;
        if (marketStatus != null && !marketStatus.isBlank()) {
            try {
                marketStatusEnum = MarketStatus.valueOf(marketStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid marketStatus value: " + marketStatus, "VALIDATION_ERROR"));
            }
        }

        // Build search request
        QuizSearchRequest searchRequest = new QuizSearchRequest();
        searchRequest.setKeyword(keyword);
        searchRequest.setSubjectId(subjectId);
        searchRequest.setNotebookId(notebookId);
        searchRequest.setAcademicTermId(academicTermId);
        searchRequest.setExamType(examType);
        searchRequest.setVisibility(visibilityEnum);
        searchRequest.setMarketStatus(marketStatusEnum);

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0].trim();
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].trim().equalsIgnoreCase("asc")
            ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<QuizResponse> quizPage = quizService.searchMyQuizzes(searchRequest, pageable);

        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(quizPage)));
    }
}
