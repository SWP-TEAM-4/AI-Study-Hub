package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.NotebookDocumentDeleteResponse;
import com.aistudyhub.module.document.service.NotebookDocumentService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Notebook Documents", description = "Gắn tài liệu vào notebook để phục vụ RAG/chat")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
public class NotebookDocumentController {

    private final NotebookDocumentService notebookDocumentService;

    @Operation(summary = "Lấy danh sách tài liệu đã gắn vào notebook")
    @GetMapping("/api/notebooks/{notebookId}/documents")
    public ResponseEntity<ApiResponse<PaginationResponse<DocumentResponse>>> listNotebookDocuments(
            @PathVariable Long notebookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Long subjectId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        PaginationResponse<DocumentResponse> response = notebookDocumentService.listNotebookDocuments(
                notebookId, principal.getId(), page, size, keyword, sort, subjectId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Gắn một tài liệu sẵn có vào notebook")
    @PostMapping("/api/notebooks/{notebookId}/documents/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> attachDocument(
            @PathVariable Long notebookId,
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentResponse response = notebookDocumentService.attachDocument(notebookId, documentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Gỡ một tài liệu khỏi notebook")
    @DeleteMapping("/api/notebooks/{notebookId}/documents/{documentId}")
    public ResponseEntity<ApiResponse<NotebookDocumentDeleteResponse>> detachDocument(
            @PathVariable Long notebookId,
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        NotebookDocumentDeleteResponse response = notebookDocumentService.detachDocument(
                notebookId, documentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", response));
    }
}
