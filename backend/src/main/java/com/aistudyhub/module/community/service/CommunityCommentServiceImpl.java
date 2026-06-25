package com.aistudyhub.module.community.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.CommunityComment;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.CommunityCommentResponse;
import com.aistudyhub.module.community.dto.CreateCommentRequest;
import com.aistudyhub.repository.CommunityCommentRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityCommentServiceImpl implements CommunityCommentService {
    private final CommunityCommentRepository communityCommentRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    @Override
    public void createComment(Long userId, CreateCommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getVisibility() != Visibility.MARKETPLACE
                || document.getMarketStatus() != MarketStatus.APPROVED) {

            throw new RuntimeException(
                    "Cannot comment on non-public document");
        }

        CommunityComment parentComment = null;

        if (request.getParentCommentId() != null) {

            parentComment = communityCommentRepository
                    .findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        }

        CommunityComment comment = CommunityComment.builder()
                .user(user)
                .document(document)
                .parentComment(parentComment)
                .content(request.getContent())
                .hidden(false)
                .deleted(false)
                .build();

        communityCommentRepository.save(comment);
    }

    @Override
    public List<CommunityCommentResponse> getComments(Long documentId) {
        return communityCommentRepository
                .findByDocumentIdAndHiddenFalseAndDeletedFalseOrderByCreatedAtAsc(documentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void hideComment(Long id) {
        CommunityComment comment = communityCommentRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        comment.setHidden(true);

        communityCommentRepository.save(comment);
    }

    @Override
    public void deleteComment(Long userId, Long commentId) {
        CommunityComment comment = communityCommentRepository
                .findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException(
                    "You are not allowed to delete this comment");
        }

        comment.setDeleted(true);

        communityCommentRepository.save(comment);
    }

    private CommunityCommentResponse mapToResponse(
            CommunityComment comment) {

        return CommunityCommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .fullName(comment.getUser().getFullName())
                .avatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .parentCommentId(
                        comment.getParentComment() != null
                                ? comment.getParentComment().getId()
                                : null)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
