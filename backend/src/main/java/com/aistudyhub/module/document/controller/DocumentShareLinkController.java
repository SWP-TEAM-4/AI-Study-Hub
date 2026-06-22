package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.share.CreateDocumentShareLinkRequest;
import com.aistudyhub.module.document.dto.share.DocumentShareLinkDeleteResponse;
import com.aistudyhub.module.document.dto.share.DocumentShareLinkResponse;
import com.aistudyhub.module.document.dto.share.UpdateDocumentShareLinkRequest;
import com.aistudyhub.module.document.service.DocumentShareLinkService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Document Share Links", description = "Manage public share links for documents")
public class DocumentShareLinkController {

    private final DocumentShareLinkService documentShareLinkService;

    @Operation(summary = "Create a public share link for a document")
    @PostMapping("/{documentId}/share-link")
    public ResponseEntity<ApiResponse<DocumentShareLinkResponse>> createShareLink(
            @PathVariable Long documentId,
            @Valid @RequestBody(required = false) CreateDocumentShareLinkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentShareLinkResponse response = documentShareLinkService.createShareLink(
                documentId, principal.getId(), isAdmin(principal), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document share link created successfully", response));
    }

    @Operation(summary = "Get share link configuration for a document")
    @GetMapping("/{documentId}/share-link")
    public ResponseEntity<ApiResponse<DocumentShareLinkResponse>> getShareLink(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentShareLinkResponse response = documentShareLinkService.getShareLink(
                documentId, principal.getId(), isAdmin(principal));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Update share link configuration for a document")
    @PatchMapping("/{documentId}/share-link")
    public ResponseEntity<ApiResponse<DocumentShareLinkResponse>> updateShareLink(
            @PathVariable Long documentId,
            @Valid @RequestBody UpdateDocumentShareLinkRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentShareLinkResponse response = documentShareLinkService.updateShareLink(
                documentId, principal.getId(), isAdmin(principal), request);

        return ResponseEntity.ok(ApiResponse.success("Document share link updated successfully", response));
    }

    @Operation(summary = "Delete a document share link")
    @DeleteMapping("/{documentId}/share-link")
    public ResponseEntity<ApiResponse<DocumentShareLinkDeleteResponse>> deleteShareLink(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DocumentShareLinkDeleteResponse response = documentShareLinkService.deleteShareLink(
                documentId, principal.getId(), isAdmin(principal));

        return ResponseEntity.ok(ApiResponse.success("Document share link deleted successfully", response));
    }

    private boolean isAdmin(CustomUserDetails principal) {
        return principal.getRole() == Role.ADMIN;
    }
}
