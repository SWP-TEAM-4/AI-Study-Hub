package com.aistudyhub.module.community.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.module.community.dto.CommunityCommentResponse;
import com.aistudyhub.module.community.dto.CreateCommentRequest;
import com.aistudyhub.module.community.service.CommunityCommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/community/comments")
@RequiredArgsConstructor
public class CommunityCommentController {
    private final CommunityCommentService communityCommentService;

    @PostMapping
    public String createComment(
            @RequestParam Long userId,
            @RequestBody CreateCommentRequest request) {

        communityCommentService.createComment(userId, request);

        return "Comment created successfully";
    }

    @GetMapping
    public List<CommunityCommentResponse> getComments(
            @RequestParam Long documentId) {

        return communityCommentService.getComments(documentId);
    }

    @DeleteMapping("/{id}")
    public String deleteComment(
            @PathVariable Long id,
            @RequestParam Long userId) {

        communityCommentService.deleteComment(userId, id);

        return "Comment deleted successfully";
    }
}
