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
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import com.aistudyhub.module.user.dto.UserCapabilitiesResponse;

@Service
@RequiredArgsConstructor
public class CommunityPermissionService {

    private final CommunityRoleRepository communityRoleRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;

    @Transactional(readOnly = true)
    public boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    @Transactional(readOnly = true)
    public boolean hasActiveCommunityRole(Long userId, CommunityRoleType roleType) {
        if (userId == null || roleType == null) {
            return false;
        }

        return !communityRoleRepository.findActiveRolesByUserIdAndRoleType(
                userId,
                roleType,
                CommunityRoleStatus.ACTIVE,
                LocalDateTime.now()).isEmpty();
    }

    @Transactional(readOnly = true)
    public boolean hasCommunityPermission(Long userId,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId) {

        if (isAdmin(userId)) {
            return true;
        }

        return hasScopedPermission(userId, ContentTarget.of(scopeType, scopeId), roleType);
    }

    @Transactional(readOnly = true)
    public boolean canReviewMarketplace(Long userId, ContentTarget target) {
        if (isAdmin(userId)) {
            return true;
        }
        if (target == null) {
            return false;
        }

        return hasScopedPermission(userId, target,
                CommunityRoleType.REVIEWER,
                CommunityRoleType.MARKETPLACE_REVIEWER);
    }

    @Transactional(readOnly = true)
    public boolean canModerateReport(Long userId, ContentTarget target) {
        if (isAdmin(userId)) {
            return true;
        }
        if (target == null) {
            return false;
        }

        return hasScopedPermission(userId, target,
                CommunityRoleType.CONTENT_MODERATOR,
                CommunityRoleType.SUBJECT_MODERATOR);
    }

    @Transactional(readOnly = true)
    public boolean canManageScope(Long userId, CommunityScopeType scopeType, Long scopeId) {
        if (isAdmin(userId)) {
            return true;
        }

        return hasScopedPermission(userId, ContentTarget.of(scopeType, scopeId),
                CommunityRoleType.CONTENT_MODERATOR,
                CommunityRoleType.SUBJECT_MODERATOR);
    }

    @Transactional(readOnly = true)
    public UserCapabilitiesResponse getCapabilities(Long userId) {
        boolean admin = isAdmin(userId);
        LocalDateTime now = LocalDateTime.now();
        boolean reviewer = admin || hasAnyMarketplaceReviewerRole(userId, now);
        boolean moderator = admin || communityRoleRepository.existsAnyActiveRoleByUserIdAndRoleTypes(
                userId, List.of(CommunityRoleType.CONTENT_MODERATOR, CommunityRoleType.SUBJECT_MODERATOR),
                CommunityRoleStatus.ACTIVE, now);
        return UserCapabilitiesResponse.builder().admin(admin).canReviewMarketplace(reviewer)
                .canModerateReports(moderator).build();
    }

    private boolean hasAnyMarketplaceReviewerRole(Long userId, LocalDateTime now) {
        return userId != null && communityRoleRepository.existsAnyActiveRoleByUserIdAndRoleTypes(
                userId, List.of(CommunityRoleType.REVIEWER, CommunityRoleType.MARKETPLACE_REVIEWER),
                CommunityRoleStatus.ACTIVE, now);
    }

    @Transactional(readOnly = true)
    public boolean hasReviewerPermission(Long userId, CommunityScopeType scopeType, Long scopeId) {
        return canReviewMarketplace(userId, ContentTarget.of(scopeType, scopeId));
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

    @Transactional(readOnly = true)
    public void assertCanReviewMarketplace(Long userId, ContentTarget target) {
        if (!canReviewMarketplace(userId, target)) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_PERMISSION_DENIED);
        }
    }

    @Transactional(readOnly = true)
    public void assertCanModerateReport(Long userId, ContentTarget target) {
        if (!canModerateReport(userId, target)) {
            throw new AppException(ErrorCode.COMMUNITY_ROLE_PERMISSION_DENIED);
        }
    }

    private boolean isAdmin(Long userId) {
        if (userId == null) {
            return false;
        }
        return userRepository.findById(userId)
                .map(this::isAdmin)
                .orElse(false);
    }

    private boolean hasScopedPermission(Long userId, ContentTarget target, CommunityRoleType... roleTypes) {
        if (userId == null || target == null || roleTypes == null || roleTypes.length == 0) {
            return false;
        }

        PermissionContext permissionContext = resolvePermissionContext(target.scopeType(), target.scopeId());
        LocalDateTime now = LocalDateTime.now();

        return Arrays.stream(roleTypes)
                .filter(Objects::nonNull)
                .anyMatch(roleType -> {
                    List<CommunityRole> roles = communityRoleRepository.findActiveRolesByUserIdAndRoleType(
                            userId,
                            roleType,
                            CommunityRoleStatus.ACTIVE,
                            now);
                    return roles.stream().anyMatch(role -> matchesScope(role, permissionContext));
                });
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

    public record ContentTarget(
            CommunityScopeType scopeType,
            Long scopeId) {

        public static ContentTarget of(CommunityScopeType scopeType, Long scopeId) {
            return new ContentTarget(scopeType, scopeId);
        }

        public static ContentTarget global() {
            return new ContentTarget(CommunityScopeType.GLOBAL, null);
        }

        public static ContentTarget subject(Long subjectId) {
            return new ContentTarget(CommunityScopeType.SUBJECT, subjectId);
        }

        public static ContentTarget document(Long documentId) {
            return new ContentTarget(CommunityScopeType.DOCUMENT, documentId);
        }

        public static ContentTarget quiz(Long quizId) {
            return new ContentTarget(CommunityScopeType.QUIZ, quizId);
        }

        public static ContentTarget flashcardDeck(Long flashcardDeckId) {
            return new ContentTarget(CommunityScopeType.FLASHCARD_DECK, flashcardDeckId);
        }
    }
}
