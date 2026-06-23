package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.ContentReportRequest;
import com.aistudyhub.module.community.dto.ContentReportResponse;
import com.aistudyhub.module.community.service.ContentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Student báo cáo nội dung vi phạm.
 * <p>
 * Base path: /api/reports
 * <ul>
 *   <li>POST / – Tạo báo cáo vi phạm (yêu cầu xác thực)</li>
 *   <li>GET /my – Xem danh sách báo cáo của mình (yêu cầu xác thực)</li>
 * </ul>
 * Owner: BE3 (Task BE-044)
 */
@Tag(name = "Content Reports", description = "API báo cáo nội dung vi phạm")
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ContentReportController {

    private final ContentReportService contentReportService;

    // ── ① POST: Tạo báo cáo vi phạm ──────────────────────────────────────────

    /**
     * Tạo báo cáo vi phạm nội dung cho tài nguyên (Document/Quiz/FlashcardDeck).
     * Yêu cầu Bearer Token (STUDENT+).
     */
    @Operation(
            summary = "Tạo báo cáo vi phạm nội dung",
            description = "Tạo báo cáo vi phạm cho tài nguyên (DOCUMENT, QUIZ, FLASHCARD_DECK). "
                    + "Yêu cầu xác thực. Trạng thái mặc định: PENDING_ADMIN.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tạo báo cáo thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ hoặc target type sai"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tài nguyên đích không tồn tại")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<ContentReportResponse>> createReport(
            @Valid @RequestBody ContentReportRequest request) {
        ContentReportResponse response = contentReportService.createReport(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── ② GET /my: Danh sách báo cáo của chính mình ──────────────────────────

    /**
     * Lấy danh sách báo cáo do người dùng hiện tại tạo, phân trang.
     * Yêu cầu Bearer Token (STUDENT+).
     */
    @Operation(
            summary = "Xem danh sách báo cáo của tôi",
            description = "Lấy danh sách báo cáo vi phạm do chính người dùng đang đăng nhập tạo. "
                    + "Hỗ trợ phân trang, tìm kiếm và sắp xếp.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PaginationResponse<ContentReportResponse>>> getMyReports(
            @Parameter(description = "Số trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số phần tử mỗi trang")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Từ khóa tìm kiếm trong chi tiết báo cáo")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Sắp xếp: newest (mặc định) hoặc oldest")
            @RequestParam(defaultValue = "newest") String sort) {
        PaginationResponse<ContentReportResponse> response =
                contentReportService.getMyReports(page, size, keyword, sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
