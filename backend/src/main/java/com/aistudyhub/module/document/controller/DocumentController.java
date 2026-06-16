package com.aistudyhub.module.document.controller;

import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.CreateDocumentRequest;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentRequest;
import com.aistudyhub.module.document.service.DocumentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @PostMapping
    public ApiResponse<DocumentResponse> createDocument(@PathVariable Long userId,
            @Valid @RequestBody CreateDocumentRequest request) {
        return ApiResponse.success(documentService.createDocument(userId, request));
    }

    @GetMapping
    public ApiResponse<List<DocumentResponse>> getMyDocument(@RequestParam Long userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) Visibility visibility,
            @RequestParam(required = false) ProcessingStatus processingStatus) {
        return ApiResponse.success(
                documentService.getMyDocument(userId, keyword, subjectId, fileType, visibility, processingStatus));
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentResponse> getDocumentDetails(@PathVariable Long id,
            @RequestParam Long userId) {
        return ApiResponse.success(documentService.getDocumentDetails(id, userId));
    }

    @PutMapping("/{id}")
    public ApiResponse<DocumentResponse> updateDocument(@PathVariable String id, @RequestBody Long userId,
            @Valid @RequestBody UpdateDocumentRequest request) {
        return ApiResponse.success(documentService.updateDocument(userId, userId, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id, @RequestParam Long userId) {
        documentService.deleteDocument(id, userId);
        return ApiResponse.success("Deleted document is successfully");
    }

}
