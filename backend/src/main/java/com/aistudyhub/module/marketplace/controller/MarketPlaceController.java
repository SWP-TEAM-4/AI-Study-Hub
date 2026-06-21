package com.aistudyhub.module.marketplace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceSubmitRequest;
import com.aistudyhub.module.marketplace.service.MarketPlaceService;
import com.aistudyhub.module.quiz.dto.QuizResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller cung cấp các API để người dùng đăng tải các tài nguyên học tập
 * (Tài liệu, Đề thi, Flashcard) lên Chợ (Marketplace).
 * Các tài nguyên được gửi lên sẽ ở trạng thái chờ duyệt (PENDING) và chế độ
 * hiển thị MARKETPLACE.
 * 
 * Owner: BE3 (Task BE-027)
 */
@Tag(name = "Marketplace Publish", description = "Đăng tải tài nguyên lên Chợ tài liệu (Publish to Marketplace) - BE3")
@RestController
@SecurityRequirement(name = "Bearer Authentication")
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@Slf4j
public class MarketPlaceController {

    private final MarketPlaceService marketPlaceService;

    /**
     * API đăng tải tài liệu (Document) lên Marketplace.
     * Ghi nhận ghi chú (note) từ người dùng gửi lên chợ và lưu trữ vào database.
     *
     * @param id      ID của tài liệu cần đăng tải
     * @param request Yêu cầu chứa ghi chú gửi lên chợ (tùy chọn)
     * @return ApiResponse chứa dữ liệu của tài liệu sau khi cập nhật trạng thái
     */
    @Operation(summary = "Đăng tải Document lên Chợ tài liệu")
    @PostMapping("/documents/{id}/submit")
    public ResponseEntity<ApiResponse<DocumentResponse>> submitDocument(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceSubmitRequest request) {
        String note = (request != null) ? request.getNote() : null;
        log.info("Received request to publish Document id={} to marketplace. Note: {}", id, note);

        DocumentResponse response = marketPlaceService.submitDocument(id, note);
        return ResponseEntity.ok(ApiResponse.success("Document submitted successfully to marketplace.", response));
    }

    /**
     * API đăng tải đề thi (Quiz) lên Marketplace.
     * Ghi nhận ghi chú (note) từ người dùng gửi lên chợ và lưu trữ vào database.
     *
     * @param id      ID của đề thi cần đăng tải
     * @param request Yêu cầu chứa ghi chú gửi lên chợ (tùy chọn)
     * @return ApiResponse chứa dữ liệu của đề thi sau khi cập nhật trạng thái
     */
    @Operation(summary = "Đăng tải Quiz lên Chợ tài liệu")
    @PostMapping("/quizzes/{id}/submit")
    public ResponseEntity<ApiResponse<QuizResponse>> submitQuiz(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceSubmitRequest request) {
        String note = (request != null) ? request.getNote() : null;
        log.info("Received request to publish Quiz id={} to marketplace. Note: {}", id, note);

        QuizResponse response = marketPlaceService.submitQuiz(id, note);
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully to marketplace.", response));
    }

    /**
     * API đăng tải bộ thẻ ghi nhớ (Flashcard Deck) lên Marketplace.
     * Ghi nhận ghi chú (note) từ người dùng gửi lên chợ và lưu trữ vào database.
     *
     * @param id      ID của bộ thẻ ghi nhớ cần đăng tải
     * @param request Yêu cầu chứa ghi chú gửi lên chợ (tùy chọn)
     * @return ApiResponse chứa dữ liệu của bộ thẻ ghi nhớ sau khi cập nhật trạng
     *         thái
     */
    @Operation(summary = "Đăng tải FlashcardDeck lên Chợ tài liệu")
    @PostMapping("/flashcard-decks/{id}/submit")
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> submitFlashcardDeck(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceSubmitRequest request) {
        String note = (request != null) ? request.getNote() : null;
        log.info("Received request to publish FlashcardDeck id={} to marketplace. Note: {}", id, note);

        FlashcardDeckResponse response = marketPlaceService.submitFlashcardDeck(id, note);
        return ResponseEntity
                .ok(ApiResponse.success("Flashcard deck submitted successfully to marketplace.", response));
    }
}