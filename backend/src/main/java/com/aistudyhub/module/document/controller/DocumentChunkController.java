package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.DocumentDeleteChunksResponse;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentChunkRequest;
import com.aistudyhub.module.document.service.DocumentChunkService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Owner: BE1 – RAG Core
 * <p>
 * APIs cho DocumentChunk processing.
 * Đây là entry point của RAG pipeline: Document → Chunks → Chat AI.
 */
@Tag(name = "Document Chunks", description = "Xử lý document thành chunks cho RAG AI")
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentChunkController {

    private final DocumentChunkService documentChunkService;

    /**
     * Trigger processing document → extract text → tách chunks → lưu DB.
     * <p>
     * Nếu document đã có chunks, sẽ xóa chunks cũ và tạo lại (re-process).
     * Processing status lifecycle: PENDING → PROCESSING → SUCCESS/FAILED
     */
    @Operation(summary = "Process document thành chunks cho RAG",
            description = "Extract text từ file, tách thành chunks, lưu vào DB. "
                    + "Nếu đã có chunks cũ sẽ xóa và tạo lại.")
    @PostMapping("/{documentId}/process")
    public ResponseEntity<ApiResponse<DocumentProcessResponse>> processDocument(
            @PathVariable Long documentId,
            @RequestBody(required = false) DocumentProcessRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentProcessResponse response = documentChunkService.processDocument(
                documentId, principal.getId(), request);

        return ResponseEntity.ok(ApiResponse.success("Document processed successfully", response));
    }

    /**
     * Lấy danh sách chunks của một document, sắp xếp theo chunkIndex.
     */
    @Operation(summary = "Lấy danh sách chunks của document",
            description = "Trả về tất cả chunks đã tách, sắp xếp theo thứ tự chunkIndex.")
    @GetMapping("/{documentId}/chunks")
    public ResponseEntity<ApiResponse<List<DocumentChunkResponse>>> getChunks(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        List<DocumentChunkResponse> chunks = documentChunkService.getChunks(
                documentId, principal.getId());

        return ResponseEntity.ok(ApiResponse.success(chunks));
    }

    /**
     * Cập nhật text của một chunk đã extract và regenerate embedding cho RAG.
     */
    @Operation(summary = "Cập nhật text của một document chunk",
            description = "Cho phép owner chỉnh lại text Gemini đã chunking và cập nhật embedding tương ứng.")
    @PatchMapping("/{documentId}/chunks/{chunkId}")
    public ResponseEntity<ApiResponse<DocumentChunkResponse>> updateChunk(
            @PathVariable Long documentId,
            @PathVariable Long chunkId,
            @Valid @RequestBody UpdateDocumentChunkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentChunkResponse chunk = documentChunkService.updateChunk(
                documentId, chunkId, principal.getId(), request);

        return ResponseEntity.ok(ApiResponse.success("Chunk updated successfully", chunk));
    }

    /**
     * Xóa tất cả chunks của document và reset processingStatus về PENDING.
     */
    @Operation(summary = "Xóa chunks và reset processing status",
            description = "Xóa toàn bộ chunks của document, reset processingStatus = PENDING.")
    @DeleteMapping("/{documentId}/chunks")
    public ResponseEntity<ApiResponse<DocumentDeleteChunksResponse>> deleteChunks(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentDeleteChunksResponse response = documentChunkService.deleteChunks(documentId, principal.getId());

        return ResponseEntity.ok(ApiResponse.success("Chunks deleted successfully", response));
    }
}
