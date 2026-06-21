package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.service.DocumentUploadService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Owner: BE2 (skeleton hoàn chỉnh bởi BE1 để unblock demo flow)
 * <p>
 * Controller xử lý upload document.
 * Sau khi upload thành công, processingStatus = PENDING.
 * Gọi POST /api/documents/{id}/process để extract text → chunks.
 */
@Tag(name = "Document Upload", description = "Upload tài liệu (PDF/DOCX/PPTX/TXT) lên storage")
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentUploadController {

    private final DocumentUploadService documentUploadService;

    /**
     * Upload file document lên storage (local hoặc Supabase).
     * <p>
     * Sau khi upload thành công:
     * - processingStatus = PENDING
     * - Gọi POST /api/documents/{id}/process để chuyển thành chunks
     *
     * @param file        file upload (multipart/form-data)
     * @param subjectId   (optional) ID subject gắn với document
     * @param title       (optional) tiêu đề, mặc định là tên file
     * @param description (optional) mô tả
     */
    @Operation(
            summary = "Upload tài liệu lên storage",
            description = "Hỗ trợ: PDF, DOCX, PPTX, TXT. Giới hạn: 50MB. "
                    + "Sau upload, gọi POST /api/documents/{id}/process để tách chunks cho RAG."
    )
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "subjectId", required = false) Long subjectId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentResponse response = documentUploadService.uploadDocument(
                file,
                principal.getId(),
                subjectId,
                title,
                description
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded successfully. Call /process to start chunking.", response));
    }
}
