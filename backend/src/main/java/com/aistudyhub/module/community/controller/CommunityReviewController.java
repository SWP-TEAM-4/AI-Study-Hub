package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.community.dto.CommunityReviewRequest;
import com.aistudyhub.module.community.dto.CommunityReviewResponse;
import com.aistudyhub.module.community.service.CommunityReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller expose 4 API đánh giá cộng đồng cho tài nguyên (Document/Quiz/FlashcardDeck).
 * <p>
 * Base path: /api/community/reviews
 * <ul>
 *   <li>POST   / – Tạo đánh giá mới (yêu cầu xác thực)</li>
 *   <li>PUT    /{id} – Cập nhật đánh giá (chỉ tác giả)</li>
 *   <li>DELETE /{id} – Xóa đánh giá (chỉ tác giả)</li>
 *   <li>GET    / – Lấy danh sách đánh giá phân trang (công khai)</li>
 * </ul>
 * Owner: BE3 (Task BE-042)
 */
@Tag(name = "Community Reviews", description = "API đánh giá và bình luận tài nguyên cộng đồng")
@RestController
@RequestMapping("/api/community/reviews")
@RequiredArgsConstructor
public class CommunityReviewController {

    private final CommunityReviewService communityReviewService;

    // ── ① POST: Tạo đánh giá mới ──────────────────────────────────────────────

    /**
     * Tạo một đánh giá cộng đồng mới cho tài nguyên.
     * Yêu cầu Bearer Token (STUDENT+). Mỗi user chỉ đánh giá 1 lần mỗi tài nguyên.
     */
    @Operation(
            summary = "Tạo đánh giá cộng đồng mới",
            description = "Tạo đánh giá rating/bình luận cho tài nguyên (DOCUMENT, QUIZ, FLASHCARD_DECK). "
                    + "Yêu cầu xác thực. Mỗi user chỉ được đánh giá 1 tài nguyên tối đa 1 lần.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tạo đánh giá thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tài nguyên đích không tồn tại"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Đã đánh giá tài nguyên này rồi")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<CommunityReviewResponse>> createReview(
            @Valid @RequestBody CommunityReviewRequest request) {
        CommunityReviewResponse response = communityReviewService.createReview(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── ② DELETE: Xóa đánh giá ────────────────────────────────────────────────

    /**
     * Xóa một đánh giá cộng đồng. Chỉ tác giả tạo đánh giá mới có quyền xóa.
     */
    @Operation(
            summary = "Xóa đánh giá cộng đồng",
            description = "Xóa đánh giá theo ID. Chỉ người tạo đánh giá mới được phép xóa.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền xóa"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Đánh giá không tồn tại")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteReview(
            @Parameter(description = "ID của đánh giá cần xóa") @PathVariable Long id) {
        communityReviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", Map.of("deleted", true)));
    }

    // ── ③ PUT: Cập nhật đánh giá ──────────────────────────────────────────────

    /**
     * Cập nhật một đánh giá cộng đồng đã tồn tại.
     * Chỉ tác giả tạo đánh giá mới có quyền chỉnh sửa.
     */
    @Operation(
            summary = "Cập nhật đánh giá cộng đồng",
            description = "Cập nhật rating và nội dung bình luận. Chỉ tác giả tạo đánh giá mới được phép sửa.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền sửa"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Đánh giá không tồn tại")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommunityReviewResponse>> updateReview(
            @Parameter(description = "ID của đánh giá cần cập nhật") @PathVariable Long id,
            @Valid @RequestBody CommunityReviewRequest request) {
        CommunityReviewResponse response = communityReviewService.updateReview(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── ④ GET: Lấy danh sách đánh giá phân trang ─────────────────────────────

    /**
     * Lấy danh sách đánh giá cộng đồng theo tài nguyên. Công khai, không cần token.
     * Sắp xếp mới nhất trước.
     */
    @Operation(
            summary = "Lấy danh sách đánh giá cộng đồng",
            description = "Lấy danh sách đánh giá phân trang theo loại tài nguyên và ID. "
                    + "Công khai, không cần xác thực. Sắp xếp theo thời gian tạo mới nhất.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "targetType hoặc targetId không hợp lệ")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<CommunityReviewResponse>>> getReviews(
            @Parameter(description = "Loại tài nguyên: DOCUMENT, QUIZ, FLASHCARD_DECK", required = true)
            @RequestParam String targetType,
            @Parameter(description = "ID của tài nguyên", required = true)
            @RequestParam Long targetId,
            @Parameter(description = "Số trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số phần tử mỗi trang")
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<CommunityReviewResponse> response =
                communityReviewService.getReviews(targetType, targetId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
