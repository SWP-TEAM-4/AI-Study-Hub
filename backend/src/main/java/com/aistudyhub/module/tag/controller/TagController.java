package com.aistudyhub.module.tag.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.tag.dto.CreateTagRequest;
import com.aistudyhub.module.tag.dto.TagResponse;
import com.aistudyhub.module.tag.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping("/tags")
    public ApiResponse<List<TagResponse>> getAllTags() {
        return ApiResponse.success(tagService.getAllTags());
    }

    @PostMapping("/tags")
    public ApiResponse<TagResponse> createTag(@Valid @RequestBody CreateTagRequest request) {
        return ApiResponse.success(tagService.createTag(request));
    }

    @PostMapping("/documents/{documentId}/tags/{tagId}")
    public ApiResponse<Void> addTagToDocument(@PathVariable Long documentId, @PathVariable Long tagId) {
        tagService.addTagToDocument(documentId, tagId);
        return ApiResponse.success("Tag added to document successfully");
    }

    @DeleteMapping("/documents/{documentId}/tags/{tagId}")
    public ApiResponse<Void> removeTagFromDocument(@PathVariable Long documentId, @PathVariable Long tagId) {
        tagService.removeTagFromDocument(documentId, tagId);
        return ApiResponse.success("Tag removed from document successfully");
    }

    @GetMapping("/documents/{documentId}/tags")
    public ApiResponse<List<TagResponse>> getTagsByDocumentId(@PathVariable Long documentId) {
        return ApiResponse.success(tagService.getTagsByDocumentId(documentId));
    }
}
