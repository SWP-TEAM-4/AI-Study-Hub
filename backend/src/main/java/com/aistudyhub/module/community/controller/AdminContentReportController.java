package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.ContentReportResponse;
import com.aistudyhub.module.community.service.ContentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Admin/Moderator xem danh sách báo cáo toàn hệ thống.
 * <p>
 * Base path: /api/admin/reports
 * Quyền: ADMIN (via SecurityConfig) hoặc Moderator (kiểm tra qua
 * CommunityPermissionService).
 * <p>
 * Lưu ý: SecurityConfig hiện tại cấu hình /api/admin/** → hasRole("ADMIN").
 * Nếu muốn cho Moderator (STUDENT có CommunityRole) truy cập, cần điều chỉnh
 * SecurityConfig
 * hoặc chuyển endpoint sang path khác. Hiện tại, logic kiểm tra quyền Moderator
 * đã được xử lý bên trong Service để sẵn sàng khi mở rộng.
 * <p>
 * Owner: BE3 (Task BE-044)
 */
@Tag(name = "Admin Content Reports", description = "API quản lý báo cáo vi phạm (Admin/Moderator)")
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminContentReportController {

        private final ContentReportService contentReportService;

        // ── GET: Danh sách báo cáo toàn hệ thống ─────────────────────────────────

        /**
         * Lấy danh sách báo cáo vi phạm toàn hệ thống (phân trang).
         * Admin xem toàn bộ, Moderator chỉ xem trong phạm vi quản lý.
         */
        @Operation(summary = "Xem danh sách báo cáo toàn hệ thống", description = "Admin/Moderator xem danh sách báo cáo vi phạm. "
                        + "Hỗ trợ lọc theo trạng thái, mức độ nghiêm trọng, từ khóa và sắp xếp.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        @GetMapping
        public ResponseEntity<ApiResponse<PaginationResponse<ContentReportResponse>>> getAdminReports(
                        @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Số phần tử mỗi trang") @RequestParam(defaultValue = "10") int size,
                        @Parameter(description = "Từ khóa tìm kiếm") @RequestParam(required = false) String keyword,
                        @Parameter(description = "Sắp xếp: newest (mặc định) hoặc oldest") @RequestParam(defaultValue = "newest") String sort,
                        @Parameter(description = "Lọc theo trạng thái: PENDING_ADMIN, RESOLVED, REJECTED") @RequestParam(required = false) String status,
                        @Parameter(description = "Lọc theo mức độ nghiêm trọng: LOW, MEDIUM, HIGH") @RequestParam(required = false) String severityLevel) {
                PaginationResponse<ContentReportResponse> response = contentReportService.getAdminReports(page, size,
                                keyword, sort, status, severityLevel);
                return ResponseEntity.ok(ApiResponse.success(response));
        }

        // ── PATCH /{id}/resolve: Duyệt báo cáo vi phạm ─────────────────────────────

        /**
         * Đánh dấu báo cáo vi phạm là đã giải quyết (RESOLVED).
         * Admin/Moderator thực hiện.
         */
        @Operation(summary = "Duyệt báo cáo vi phạm", description = "Đánh dấu báo cáo vi phạm là đã được xử lý (RESOLVED) và lưu lại ghi chú.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Duyệt báo cáo thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Báo cáo đã được xử lý trước đó"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy báo cáo")
        })
        @PatchMapping("/{id}/resolve")
        public ResponseEntity<ApiResponse<PaginationResponse<ContentReportResponse>>> resolveReport(
                        @Parameter(description = "ID báo cáo cần duyệt") @PathVariable Long id,
                        @RequestBody com.aistudyhub.module.community.dto.ReportModerationRequest request,
                        @Parameter(description = "Số trang kết quả trả về") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Số phần tử mỗi trang") @RequestParam(defaultValue = "10") int size) {
                PaginationResponse<ContentReportResponse> response = contentReportService.resolveReport(
                                id, request.getAdminNote(), page, size);
                return ResponseEntity.ok(ApiResponse.success("Report approved successfully", response));
        }

        // ── PATCH /{id}/reject: Từ chối báo cáo vi phạm ────────────────────────────

        /**
         * Từ chối báo cáo vi phạm (REJECTED).
         * Admin/Moderator thực hiện.
         */
        @Operation(summary = "Từ chối báo cáo vi phạm", description = "Bác bỏ báo cáo vi phạm (REJECTED) và lưu lại lý do bác bỏ.")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Từ chối báo cáo thành công"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Báo cáo đã được xử lý trước đó"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy báo cáo")
        })
        @PatchMapping("/{id}/reject")
        public ResponseEntity<ApiResponse<PaginationResponse<ContentReportResponse>>> rejectReport(
                        @Parameter(description = "ID báo cáo cần từ chối") @PathVariable Long id,
                        @RequestBody com.aistudyhub.module.community.dto.ReportModerationRequest request,
                        @Parameter(description = "Số trang kết quả trả về") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Số phần tử mỗi trang") @RequestParam(defaultValue = "10") int size) {
                PaginationResponse<ContentReportResponse> response = contentReportService.rejectReport(
                                id, request.getAdminNote(), page, size);
                return ResponseEntity.ok(ApiResponse.success("Report rejected successfully", response));
        }
}
