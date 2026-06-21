package com.aistudyhub.module.flashcard.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardReviewRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardReviewResponse;
import com.aistudyhub.module.flashcard.service.FlashcardProgressService;
import com.aistudyhub.module.flashcard.service.FlashcardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller cung cấp các REST API phục vụ quản lý riêng lẻ từng thẻ nhớ
 * (Flashcard Card).
 * <p>
 * Yêu cầu xác thực Bearer Token để thực thi.
 * Các endpoint hỗ trợ cập nhật nội dung của thẻ và xóa thẻ khỏi hệ thống.
 * <p>
 * Owner: BE3 (Task BE-024)
 */
@Tag(name = "Flashcard Card", description = "Quản lý thẻ nhớ riêng lẻ (Flashcard Card) - BE3")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {
    private final FlashcardService flashcardService;
    private final FlashcardProgressService progressService;

    /**
     * API cập nhật nội dung (mặt trước, mặt sau) của một thẻ nhớ cụ thể.
     * <p>
     * Yêu cầu người thực hiện hành động này phải là chủ sở hữu bộ bài chứa thẻ đó.
     * 
     * @param cardId  ID của chiếc thẻ nhớ cần chỉnh sửa
     * @param request chứa nội dung mặt trước (frontText) và mặt sau (backText) mới
     * @return ResponseEntity chứa thông tin thẻ sau khi cập nhật thành công và mã
     *         trạng thái HTTP 200 OK
     */
    @Operation(summary = "Cập nhật nội dung một Card")
    @PutMapping("/{cardId}")
    public ResponseEntity<ApiResponse<FlashcardResponse>> updateCard(
            @PathVariable Long cardId,
            @Valid @RequestBody FlashcardRequest request) {
        FlashcardResponse response = flashcardService.updateCard(cardId, request);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    /**
     * API xóa hoàn toàn một thẻ nhớ khỏi bộ bài.
     * <p>
     * Yêu cầu người thực hiện hành động này phải là chủ sở hữu bộ bài chứa thẻ đó.
     * 
     * @param cardId ID của chiếc thẻ nhớ cần xóa
     * @return ResponseEntity thông báo xóa thành công và mã trạng thái HTTP 200 OK
     *         (trả về JSON dạng {"deleted": true})
     */
    @Operation(summary = "Xóa một Card khỏi bộ bài")
    @DeleteMapping("/{cardId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteCard(@PathVariable Long cardId) {
        flashcardService.deleteCard(cardId);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", Map.of("deleted", true)));
    }

    /**
     * API lấy danh sách các thẻ nhớ đến hạn cần ôn tập của người dùng đăng nhập hiện tại.
     * 
     * @param deckId ID của bộ bài flashcard cần lọc (tùy chọn)
     * @return Danh sách các FlashcardResponse đến hạn
     */
    @Operation(summary = "Lấy danh sách các thẻ nhớ đến hạn ôn tập")
    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<FlashcardResponse>>> getDueCards(
            @RequestParam(required = false) Long deckId) {
        List<FlashcardResponse> response = progressService.getDueCards(deckId);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    /**
     * API ghi nhận kết quả đánh giá (ôn tập) một thẻ flashcard cụ thể.
     * 
     * @param cardId  ID của thẻ nhớ được ôn
     * @param request chứa kết quả đánh giá (REMEMBERED hoặc FORGOT)
     * @return ResponseEntity chứa tiến độ ôn tập mới cập nhật của thẻ
     */
    @Operation(summary = "Ghi nhận kết quả ôn tập một thẻ flashcard")
    @PostMapping("/{cardId}/review")
    public ResponseEntity<ApiResponse<FlashcardReviewResponse>> reviewCard(
            @PathVariable Long cardId,
            @Valid @RequestBody FlashcardReviewRequest request) {
        FlashcardReviewResponse response = progressService.reviewCard(cardId, request);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}
