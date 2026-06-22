package com.aistudyhub.module.marketplace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceItemResponse;
import com.aistudyhub.module.marketplace.dto.MarketplaceQueryRequest;
import com.aistudyhub.module.marketplace.dto.MarketplaceSubmitRequest;
import com.aistudyhub.module.marketplace.dto.MarketplaceCloneRequest;
import com.aistudyhub.module.marketplace.service.MarketPlaceService;
import com.aistudyhub.module.marketplace.service.MarketplaceCloneService;
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
 * Owner: BE3 (Task BE-027) (Task BE-028)
 */
@Tag(name = "Marketplace Publish", description = "Đăng tải tài nguyên lên Chợ tài liệu (Publish to Marketplace) - BE3")
@RestController
@SecurityRequirement(name = "Bearer Authentication")
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@Slf4j
public class MarketPlaceController {

    private final MarketPlaceService marketPlaceService;
    private final MarketplaceCloneService marketplaceCloneService;

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

    /**
     * API duyệt và tìm kiếm danh sách tài liệu học tập (Documents) đã được duyệt
     * trên Chợ.
     *
     * @param request DTO chứa các tham số lọc và phân trang truyền lên từ Frontend
     *                (Query Params)
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PaginationResponse của
     *         các tài liệu tìm thấy
     */
    @Operation(summary = "Duyệt danh sách Document trên Chợ tài liệu")
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketplaceItemResponse>>> getDocuments(
            @ModelAttribute MarketplaceQueryRequest request) {
        log.info("Browsing Documents in marketplace with query: keyword={}, subjectId={}",
                request.getKeyword(), request.getSubjectId());

        PaginationResponse<MarketplaceItemResponse> response = marketPlaceService.getDocumentsInMarket(request);
        return ResponseEntity.ok(ApiResponse.success("Get documents in marketplace successfully.", response));
    }

    /**
     * API duyệt và tìm kiếm danh sách đề thi (Quizzes) đã được duyệt trên Chợ.
     *
     * @param request DTO chứa các tham số lọc và phân trang, hỗ trợ học kỳ và loại
     *                đề thi
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PaginationResponse của
     *         các đề thi tìm thấy
     */
    @Operation(summary = "Duyệt danh sách Quiz trên Chợ tài liệu")
    @GetMapping("/quizzes")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketplaceItemResponse>>> getQuizzes(
            @ModelAttribute MarketplaceQueryRequest request) {
        log.info("Browsing Quizzes in marketplace with query: keyword={}, subjectId={}, termId={}, examType={}",
                request.getKeyword(), request.getSubjectId(), request.getAcademicTermId(), request.getExamType());

        PaginationResponse<MarketplaceItemResponse> response = marketPlaceService.getQuizzesInMarket(request);
        return ResponseEntity.ok(ApiResponse.success("Get quizzes in marketplace successfully.", response));
    }

    /**
     * API duyệt và tìm kiếm danh sách bộ thẻ ghi nhớ (Flashcard Decks) đã được
     * duyệt trên Chợ.
     *
     * @param request DTO chứa các tham số lọc và phân trang
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PaginationResponse của
     *         các bộ thẻ tìm thấy
     */
    @Operation(summary = "Duyệt danh sách FlashcardDeck trên Chợ tài liệu")
    @GetMapping("/flashcard-decks")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketplaceItemResponse>>> getFlashcardDecks(
            @ModelAttribute MarketplaceQueryRequest request) {
        log.info("Browsing FlashcardDecks in marketplace with query: keyword={}, subjectId={}",
                request.getKeyword(), request.getSubjectId());

        PaginationResponse<MarketplaceItemResponse> response = marketPlaceService.getFlashcardDecksInMarket(request);
        return ResponseEntity.ok(ApiResponse.success("Get flashcard decks in marketplace successfully.", response));
    }

    /**
     * API tìm kiếm tổng hợp (Search) gộp cả 3 loại tài nguyên học tập trên Chợ.
     * Trả về kết quả trộn lẫn đã phân trang và sắp xếp toàn cục theo yêu cầu
     * Frontend.
     *
     * @param request DTO chứa từ khóa tìm kiếm và mã môn học lọc chung
     * @return ResponseEntity chứa ApiResponse bọc đối tượng PaginationResponse của
     *         danh sách gộp
     */
    @Operation(summary = "Tìm kiếm tổng hợp các tài nguyên trên Chợ")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PaginationResponse<MarketplaceItemResponse>>> searchMarketplace(
            @ModelAttribute MarketplaceQueryRequest request) {
        log.info("Searching marketplace with query: keyword={}, subjectId={}",
                request.getKeyword(), request.getSubjectId());

        PaginationResponse<MarketplaceItemResponse> response = marketPlaceService.searchMarketplace(request);
        return ResponseEntity.ok(ApiResponse.success("Search marketplace successfully.", response));
    }

    /**
     * API nhân bản tài liệu (Document) từ Marketplace về không gian cá nhân của học
     * viên.
     *
     * @param id      ID của tài liệu cần nhân bản
     * @param request Yêu cầu chứa ID của Notebook đích (tùy chọn)
     * @return ResponseEntity chứa ApiResponse bọc DocumentResponse của tài liệu đã
     *         nhân bản
     */
    @Operation(summary = "Nhân bản Document từ Chợ về cá nhân")
    @PostMapping("/documents/{id}/clone")
    public ResponseEntity<ApiResponse<DocumentResponse>> cloneDocument(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceCloneRequest request) {
        log.info("Received request to clone Document id={} to workspace. Notebook target: {}",
                id, request != null ? request.getTargetNotebookId() : "none");

        DocumentResponse response = marketplaceCloneService.cloneDocumentInMarket(id, request);
        return ResponseEntity.ok(ApiResponse.success("Document cloned successfully from marketplace.", response));
    }

    /**
     * API nhân bản đề thi (Quiz) từ Marketplace về không gian cá nhân của học viên.
     *
     * @param id      ID của đề thi cần nhân bản
     * @param request Yêu cầu chứa ID của Notebook đích (tùy chọn)
     * @return ResponseEntity chứa ApiResponse bọc QuizResponse của đề thi đã nhân
     *         bản
     */
    @Operation(summary = "Nhân bản Quiz từ Chợ về cá nhân")
    @PostMapping("/quizzes/{id}/clone")
    public ResponseEntity<ApiResponse<QuizResponse>> cloneQuiz(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceCloneRequest request) {
        log.info("Received request to clone Quiz id={} to workspace. Notebook target: {}",
                id, request != null ? request.getTargetNotebookId() : "none");

        QuizResponse response = marketplaceCloneService.cloneQuizInMarket(id, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz cloned successfully from marketplace.", response));
    }

    /**
     * API nhân bản bộ thẻ ghi nhớ (FlashcardDeck) từ Marketplace về không gian cá
     * nhân của học viên.
     *
     * @param id      ID của bộ thẻ ghi nhớ cần nhân bản
     * @param request Yêu cầu chứa ID của Notebook đích (tùy chọn)
     * @return ResponseEntity chứa ApiResponse bọc FlashcardDeckResponse của bộ thẻ
     *         đã nhân bản
     */
    @Operation(summary = "Nhân bản FlashcardDeck từ Chợ về cá nhân")
    @PostMapping("/flashcard-decks/{id}/clone")
    public ResponseEntity<ApiResponse<FlashcardDeckResponse>> cloneFlashcardDeck(
            @PathVariable("id") Long id,
            @RequestBody(required = false) MarketplaceCloneRequest request) {
        log.info("Received request to clone FlashcardDeck id={} to workspace. Notebook target: {}",
                id, request != null ? request.getTargetNotebookId() : "none");

        FlashcardDeckResponse response = marketplaceCloneService.cloneFlashcardDeckInMarket(id, request);
        return ResponseEntity.ok(ApiResponse.success("Flashcard deck cloned successfully from marketplace.", response));
    }

}