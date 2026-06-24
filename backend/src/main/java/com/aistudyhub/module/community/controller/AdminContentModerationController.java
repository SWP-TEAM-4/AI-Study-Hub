package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.community.dto.ContentModerationRequest;
import com.aistudyhub.module.community.service.ContentReportService;
import com.aistudyhub.module.user.dto.UserProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Admin quản lý trạng thái ẩn/hiện của tài nguyên (Document, Quiz, FlashcardDeck).
 * <p>
 * Base path: /api/admin/content
 * Quyền: Chỉ ADMIN mới được phép truy cập (cấu hình SecurityConfig).
 * <p>
 * Owner: BE3 (Task BE-045)
 */
@Tag(name = "Admin Content Moderation", description = "API quản trị trạng thái hiển thị nội dung (Admin)")
@RestController
@RequestMapping("/api/admin/content")
@RequiredArgsConstructor
public class AdminContentModerationController {

    private final ContentReportService contentReportService;

    // ── ① PATCH /{targetType}/{targetId}/hide: Ẩn nội dung vi phạm ─────────────

    /**
     * Ẩn tài nguyên khỏi hệ thống công cộng (chuyển visibility thành PRIVATE và marketStatus thành REJECTED).
     */
    @Operation(summary = "Ẩn nội dung vi phạm", description = "Ẩn tài nguyên (DOCUMENT, QUIZ, FLASHCARD_DECK) khỏi thư viện công cộng.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Ẩn tài nguyên thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập (chỉ dành cho ADMIN)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy tài nguyên")
    })
    @PatchMapping("/{targetType}/{targetId}/hide")
    public ResponseEntity<ApiResponse<UserProfileResponse>> hideContent(
            @Parameter(description = "Loại tài nguyên: DOCUMENT, QUIZ, FLASHCARD_DECK") @PathVariable String targetType,
            @Parameter(description = "ID của tài nguyên") @PathVariable Long targetId,
            @RequestBody ContentModerationRequest request) {
        UserProfileResponse response = contentReportService.hideContent(targetType, targetId, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Content hidden successfully", response));
    }

    // ── ② PATCH /{targetType}/{targetId}/restore: Khôi phục nội dung ────────────

    /**
     * Khôi phục tài nguyên bị ẩn (chuyển visibility thành PUBLIC_LINK).
     */
    @Operation(summary = "Khôi phục nội dung", description = "Khôi phục tài nguyên đã bị ẩn về trạng thái công khai.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Khôi phục tài nguyên thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập (chỉ dành cho ADMIN)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy tài nguyên")
    })
    @PatchMapping("/{targetType}/{targetId}/restore")
    public ResponseEntity<ApiResponse<UserProfileResponse>> restoreContent(
            @Parameter(description = "Loại tài nguyên: DOCUMENT, QUIZ, FLASHCARD_DECK") @PathVariable String targetType,
            @Parameter(description = "ID của tài nguyên") @PathVariable Long targetId,
            @RequestBody ContentModerationRequest request) {
        UserProfileResponse response = contentReportService.restoreContent(targetType, targetId, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Content restored successfully", response));
    }
}
