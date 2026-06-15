package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentSearchRequest;
import com.aistudyhub.module.document.service.DocumentQueryService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Documents", description = "Read APIs cho document metadata của current user")
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentQueryController {

    private final DocumentQueryService documentQueryService;

    @Operation(summary = "Lấy danh sách document của current user")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<DocumentResponse>>> searchMyDocuments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String processingStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Visibility visibilityEnum = parseVisibility(visibility);
        ProcessingStatus processingStatusEnum = parseProcessingStatus(processingStatus);

        DocumentSearchRequest request = new DocumentSearchRequest();
        request.setKeyword(keyword);
        request.setSubjectId(subjectId);
        request.setFileType(fileType);
        request.setVisibility(visibilityEnum);
        request.setProcessingStatus(processingStatusEnum);

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0].trim();
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].trim().equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<DocumentResponse> documentPage = documentQueryService.searchMyDocuments(principal.getId(), request, pageable);
        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(documentPage)));
    }

    @Operation(summary = "Lấy chi tiết document của current user")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentResponse response = documentQueryService.getDocumentById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Visibility parseVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return null;
        }
        try {
            return Visibility.valueOf(visibility.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new com.aistudyhub.common.exception.AppException(
                    com.aistudyhub.common.exception.ErrorCode.VALIDATION_ERROR,
                    "Invalid visibility value: " + visibility);
        }
    }

    private ProcessingStatus parseProcessingStatus(String processingStatus) {
        if (processingStatus == null || processingStatus.isBlank()) {
            return null;
        }
        try {
            return ProcessingStatus.valueOf(processingStatus.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new com.aistudyhub.common.exception.AppException(
                    com.aistudyhub.common.exception.ErrorCode.VALIDATION_ERROR,
                    "Invalid processingStatus value: " + processingStatus);
        }
    }
}
