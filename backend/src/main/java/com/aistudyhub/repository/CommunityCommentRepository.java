package com.aistudyhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aistudyhub.entity.CommunityComment;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    List<CommunityComment> findByDocumentIdAndHiddenFalseAndDeletedFalseOrderByCreatedAtAsc(Long documentId);
}
