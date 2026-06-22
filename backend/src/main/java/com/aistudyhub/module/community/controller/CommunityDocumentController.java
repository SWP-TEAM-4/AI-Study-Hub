package com.aistudyhub.module.community.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.community.dto.CommunityDocumentResponse;
import com.aistudyhub.module.community.service.CommunityDocumentService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/community/documents")
@RequiredArgsConstructor
public class CommunityDocumentController {
    private final CommunityDocumentService communityDocumentService;

    @GetMapping
    public ApiResponse<Page<CommunityDocumentResponse>> getDocuments(@RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String fileType,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(communityDocumentService.getDocuments(keyword,
                subjectId,
                semesterId,
                tagId,
                fileType,
                sort,
                page,
                size));
    }

    @GetMapping("/{id}")
    public ApiResponse<CommunityDocumentResponse> getDocument(@PathVariable Long id) {
        return ApiResponse.success(communityDocumentService.getDocument(id));
    }

    @GetMapping("/top")
    public ApiResponse<List<CommunityDocumentResponse>> getTopDocuments() {
        return ApiResponse.success(communityDocumentService.getTopDocuments());
    }

}
