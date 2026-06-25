package com.aistudyhub.module.community.service;

import java.util.List;

import com.aistudyhub.module.community.dto.CommunityCommentResponse;
import com.aistudyhub.module.community.dto.CreateCommentRequest;

public interface CommunityCommentService {
    void createComment(
            Long userId,
            CreateCommentRequest request);

    List<CommunityCommentResponse> getComments(
            Long documentId);

    void hideComment(Long id);

    void deleteComment(
            Long userId,
            Long commentId);
}
