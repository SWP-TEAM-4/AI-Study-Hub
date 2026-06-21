package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CommunityPermissionService {

    private final CommunityRoleRepository communityRoleRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;

    @Transactional(readOnly = true)
    public boolean hasCommunityPermission(Long userId,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId) {

        if (isAdmin(userId)) {
            return true;
        }

        LocalDateTime now = LocalDateTime.now();
        List<CommunityRole> roles = communityRoleRepository.findActiveRolesByUserIdAndRoleType(
                userId,
                roleType,
                CommunityRoleStatus.ACTIVE,
                now);

        PermissionContext permissionContext = resolvePermissionContext(scopeType, scopeId);
        return roles.stream().anyMatch(role -> matchesScope(role, permissionContext));
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermission(Long userId, CommunityScopeType scopeType, Long scopeId) {
        return hasCommunityPermission(userId, CommunityRoleType.REVIEWER, scopeType, scopeId)
                || hasCommunityPermission(userId, CommunityRoleType.MARKETPLACE_REVIEWER, scopeType, scopeId);
    }

    @Transactional(readOnly = true)
    public void assertReviewerPermission(Long userId, CommunityScopeType scopeType, Long scopeId) {
        if (!hasReviewerPermission(userId, scopeType, scopeId)) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_PERMISSION_DENIED);
        }
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermissionForDocument(Long userId, Long documentId) {
        return hasReviewerPermission(userId, CommunityScopeType.DOCUMENT, documentId);
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermissionForQuiz(Long userId, Long quizId) {
        return hasReviewerPermission(userId, CommunityScopeType.QUIZ, quizId);
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermissionForFlashcardDeck(Long userId, Long flashcardDeckId) {
        return hasReviewerPermission(userId, CommunityScopeType.FLASHCARD_DECK, flashcardDeckId);
    }

    @Transactional(readOnly = true)
    public void assertReviewerPermissionForDocument(Long userId, Long documentId) {
        assertReviewerPermission(userId, CommunityScopeType.DOCUMENT, documentId);
    }

    @Transactional(readOnly = true)
    public void assertReviewerPermissionForQuiz(Long userId, Long quizId) {
        assertReviewerPermission(userId, CommunityScopeType.QUIZ, quizId);
    }

    @Transactional(readOnly = true)
    public void assertReviewerPermissionForFlashcardDeck(Long userId, Long flashcardDeckId) {
        assertReviewerPermission(userId, CommunityScopeType.FLASHCARD_DECK, flashcardDeckId);
    }

    private boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == Role.ADMIN)
                .orElse(false);
    }

    private boolean matchesScope(CommunityRole role, PermissionContext permissionContext) {
        if (role.getStatus() != CommunityRoleStatus.ACTIVE) {
            return false;
        }

        CommunityScopeType grantedScopeType = role.getScopeType();
        if (grantedScopeType == null || grantedScopeType == CommunityScopeType.GLOBAL) {
            return true;
        }

        if (permissionContext.scopeType() == null) {
            return true;
        }

        if (grantedScopeType == permissionContext.scopeType()
                && Objects.equals(role.getScopeId(), permissionContext.scopeId())) {
            return true;
        }

        return grantedScopeType == CommunityScopeType.SUBJECT
                && permissionContext.subjectId() != null
                && Objects.equals(role.getScopeId(), permissionContext.subjectId());
    }

    private PermissionContext resolvePermissionContext(CommunityScopeType scopeType, Long scopeId) {
        if (scopeType == null || scopeType == CommunityScopeType.GLOBAL) {
            return new PermissionContext(scopeType, scopeId, null);
        }

        if (scopeType == CommunityScopeType.SUBJECT) {
            return new PermissionContext(scopeType, scopeId, scopeId);
        }

        if (scopeId == null) {
            return new PermissionContext(scopeType, null, null);
        }

        return switch (scopeType) {
            case DOCUMENT -> {
                Document document = documentRepository.findById(scopeId).orElse(null);
                yield new PermissionContext(scopeType, scopeId, extractSubjectId(document != null ? document.getSubject() : null));
            }
            case QUIZ -> {
                Quiz quiz = quizRepository.findById(scopeId).orElse(null);
                yield new PermissionContext(scopeType, scopeId, extractSubjectId(quiz != null ? quiz.getSubject() : null));
            }
            case FLASHCARD_DECK -> {
                FlashcardDeck flashcardDeck = flashcardDeckRepository.findById(scopeId).orElse(null);
                yield new PermissionContext(scopeType, scopeId,
                        extractSubjectId(flashcardDeck != null ? flashcardDeck.getSubject() : null));
            }
            case SUBJECT -> new PermissionContext(scopeType, scopeId, scopeId);
            case GLOBAL -> new PermissionContext(scopeType, scopeId, null);
        };
    }

    private Long extractSubjectId(com.aistudyhub.entity.Subject subject) {
        return subject != null ? subject.getId() : null;
    }

    private record PermissionContext(
            CommunityScopeType scopeType,
            Long scopeId,
            Long subjectId) {
    }
}
