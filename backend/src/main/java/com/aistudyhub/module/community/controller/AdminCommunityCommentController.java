package com.aistudyhub.module.community.controller;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.module.community.service.CommunityCommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/community/comments")
@RequiredArgsConstructor
public class AdminCommunityCommentController {
    private final CommunityCommentService communityCommentService;

    @PatchMapping("/{id}/hide")
    public String hideComment(
            @PathVariable Long id) {

        communityCommentService.hideComment(id);

        return "Comment hidden successfully";
    }
}
