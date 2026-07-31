package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.document.dto.share.PublicDocumentSharePreviewResponse;
import com.aistudyhub.module.document.service.DocumentShareLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/share/documents")
@RequiredArgsConstructor
@Tag(name = "Public Document Share", description = "Public endpoints for document share links")
public class PublicDocumentShareController {

    private final DocumentShareLinkService documentShareLinkService;

    @Operation(summary = "Preview shared document metadata and excerpt")
    @GetMapping("/{shareToken}")
    public ResponseEntity<ApiResponse<PublicDocumentSharePreviewResponse>> getSharedDocumentPreview(
            @PathVariable String shareToken) {

        PublicDocumentSharePreviewResponse response = documentShareLinkService.getPublicPreview(shareToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Download a shared document")
    @GetMapping("/{shareToken}/download")
    public ResponseEntity<byte[]> downloadSharedDocument(@PathVariable String shareToken) {
        DocumentShareLinkService.SharedDocumentDownload download =
                documentShareLinkService.downloadSharedDocument(shareToken);
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
