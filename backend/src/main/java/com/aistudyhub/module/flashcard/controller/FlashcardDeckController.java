package com.aistudyhub.module.flashcard.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.flashcard.dto.*;
import com.aistudyhub.module.flashcard.service.FlashcardProgressService;
import com.aistudyhub.module.flashcard.service.FlashcardService;
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

import java.util.Map;

/**
 * Controller cung cấp các REST API phục vụ quản lý bộ thẻ nhớ cá nhân
 * (Flashcard Deck).
 * <p>
 * Yêu cầu xác thực Bearer Token để thực thi các API này.
 * Các endpoint hỗ trợ CRUD metadata của bộ bài, lọc danh sách phân trang và
 * thêm thẻ (Card) mới.
 * <p>
 * Owner: BE3 (Task BE-024)
 */
@Tag(name = "Flashcard Deck", description = "Quản lý bộ thẻ nhớ (Flashcard Deck) - BE3")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/flashcard-decks")
@RequiredArgsConstructor
public class FlashcardDeckController {
    private final FlashcardProgressService progressService;
    private final FlashcardService flashcardService;

    /**
     * API tạo mới một bộ Flashcard Deck trong hệ thống.
     * <p>
     * Cung cấp tiêu đề bộ bài, có thể liên kết notebookId hoặc subjectId của người
     * dùng.
     * Mặc định khi tạo mới bộ bài sẽ ở trạng thái hiển thị PRIVATE.
     * 
     * @param request thông tin cấu hình tạo bộ Flashcard Deck
     * @return ResponseEntity chứa thông tin chi tiết bộ bài vừa được tạo và mã
     *         trạng thái HTTP 201 Created
     */
    @Operation(summary = "Tạo mới một bộ Flashcard Deck")
    @PostMapping
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> createDeck(
            @Valid @RequestBody FlashcardDeckRequest request) {
        FlashcardDeckResponse response = flashcardService.createDeck(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Success", response));
    }

    /**
     * API lấy thông tin chi tiết và danh sách thẻ nhớ của bộ Flashcard Deck.
     * <p>
     * Hệ thống tự động kiểm tra quyền sở hữu đối với các bộ bài đang ở trạng thái
     * PRIVATE.
     * 
     * @param id ID của bộ Flashcard Deck cần xem chi tiết
     * @return ResponseEntity chứa thông tin chi tiết bộ bài và mã trạng thái HTTP
     *         200 OK
     */
    @Operation(summary = "Xem chi tiết một bộ Flashcard Deck")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> getDeckById(@PathVariable Long id) {
        FlashcardDeckResponse response = flashcardService.getDeckById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * API cập nhật metadata của bộ Flashcard Deck (tiêu đề, môn học, sổ tay liên
     * kết, trạng thái hiển thị).
     * <p>
     * Yêu cầu người thực hiện hành động này phải là người tạo ra bộ bài.
     * 
     * @param id      ID của bộ bài cần cập nhật
     * @param request thông tin cập nhật mới
     * @return ResponseEntity chứa thông tin bộ bài sau khi cập nhật thành công và
     *         mã trạng thái HTTP 200 OK
     */
    @Operation(summary = "Cập nhật metadata của bộ Flashcard Deck")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> updateDeck(
            @PathVariable Long id,
            @Valid @RequestBody FlashcardDeckRequest request) {
        FlashcardDeckResponse response = flashcardService.updateDeck(id, request);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    /**
     * API xóa hoàn toàn bộ Flashcard Deck khỏi hệ thống.
     * <p>
     * Yêu cầu người thực hiện hành động này phải là người tạo ra bộ bài.
     * 
     * @param id ID của bộ bài cần xóa
     * @return ResponseEntity thông báo xóa thành công và mã trạng thái HTTP 200 OK
     *         (trả về JSON dạng {"deleted": true})
     */
    @Operation(summary = "Xóa một bộ Flashcard Deck")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteDeck(@PathVariable Long id) {
        flashcardService.deleteDeck(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", Map.of("deleted", true)));
    }

    /**
     * API lấy danh sách, tìm kiếm và lọc phân trang các bộ Flashcard do chính người
     * dùng hiện tại sở hữu.
     * <p>
     * Hỗ trợ tìm kiếm theo keyword và lọc theo subjectId, visibility, marketStatus
     * kèm sắp xếp động.
     * Việc parse Enum được xử lý an toàn để tránh lỗi
     * ClassCastException/IllegalArgumentException.
     * 
     * @param keyword      từ khóa tìm kiếm trong tiêu đề bộ bài (không bắt buộc)
     * @param subjectId    ID môn học để lọc (không bắt buộc)
     * @param visibility   trạng thái hiển thị của bộ bài (không bắt buộc)
     * @param marketStatus trạng thái trên chợ tài liệu (không bắt buộc)
     * @param page         số thứ tự trang hiện tại (mặc định = 0)
     * @param size         kích thước phần tử của một trang (mặc định = 10)
     * @param sort         tiêu chí sắp xếp, định dạng "field,direction" (mặc định =
     *                     "createdAt,desc")
     * @return ResponseEntity chứa danh sách bộ bài phân trang và mã trạng thái HTTP
     *         200 OK
     */
    @Operation(summary = "Lấy danh sách, tìm kiếm và lọc phân trang bộ Flashcard cá nhân")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<FlashcardDeckResponse>>> searchMyDecks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String marketStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        // Parse Enum an toàn để tránh ném lỗi 500 lỗi binding mặc định
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

        // Tạo đối tượng search DTO
        FlashcardDeckSearchRequest searchRequest = new FlashcardDeckSearchRequest();
        searchRequest.setKeyword(keyword);
        searchRequest.setSubjectId(subjectId);
        searchRequest.setVisibility(visibilityEnum);
        searchRequest.setMarketStatus(marketStatusEnum);

        // Phân tích thông tin sắp xếp
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0].trim();
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].trim().equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<FlashcardDeckResponse> deckPage = flashcardService.searchMyDecks(searchRequest, pageable);

        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(deckPage)));
    }

    /**
     * API thêm một chiếc thẻ nhớ (Card) mới vào bộ bài hiện có.
     * <p>
     * Yêu cầu người thực hiện hành động này phải là người sở hữu bộ bài.
     * 
     * @param deckId  ID của bộ bài cần thêm thẻ con
     * @param request chứa nội dung mặt trước (frontText) và mặt sau (backText)
     * @return ResponseEntity chứa thông tin bộ bài bao gồm cả thẻ vừa được thêm và
     *         mã trạng thái HTTP 200 OK
     */
    @Operation(summary = "Thêm một Card mới vào Deck")
    @PostMapping("/{deckId}/cards")
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> addCardToDeck(
            @PathVariable Long deckId,
            @Valid @RequestBody FlashcardRequest request) {
        FlashcardDeckResponse response = flashcardService.addCardToDeck(deckId, request);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    /**
     * API lấy tiến độ ôn tập của một bộ bài flashcard đối với người dùng đăng nhập
     * hiện tại.
     * 
     * @param deckId    ID của bộ bài cần lấy tiến độ
     * @param subjectId ID môn học (tùy chọn lọc nếu có)
     * @return ResponseEntity chứa thông tin tiến độ ôn tập bộ bài
     */
    @Operation(summary = "Lấy tiến độ ôn tập của bộ flashcard")
    @GetMapping("/{deckId}/progress")
    public ResponseEntity<ApiResponse<FlashcardDeckProgressResponse>> getDeckProgress(
            @PathVariable Long deckId,
            @RequestParam(required = false) Long subjectId) {
        FlashcardDeckProgressResponse response = progressService.getDeckProgress(deckId);
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }
}