package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.CreateDocumentRequest;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentRequest;
import com.aistudyhub.module.document.service.DocumentService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Write APIs cho document metadata của current user")
public class DocumentController {
    private final DocumentService documentService;

    @Operation(summary = "Tạo metadata document cho current user")
    @PostMapping
    public ResponseEntity<ApiResponse<DocumentResponse>> createDocument(
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(documentService.createDocument(principal.getId(), request)));
    }

    @Operation(summary = "Cập nhật metadata document của current user")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(documentService.updateDocument(id, principal.getId(), request)));
    }

    @Operation(summary = "Xóa document của current user")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        documentService.deleteDocument(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", true));
    }

    @Operation(summary = "Tải file document của current user")
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        DocumentService.DocumentFileDownload download = documentService.downloadDocument(id, principal.getId());
        String encodedFilename = URLEncoder.encode(download.filename(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(download.mediaType())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + asciiFallback(download.filename()) + "\"; filename*=UTF-8''" + encodedFilename)
                .body(download.content());
    }

    private String asciiFallback(String filename) {
        if (filename == null || filename.isBlank()) {
            return "document";
        }
        return filename.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "");
    }

}
