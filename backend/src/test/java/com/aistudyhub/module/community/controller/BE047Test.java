package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BE047Test {

    @Autowired
    private CommunityPermissionService communityPermissionService;

    @Autowired
    private CommunityRoleRepository communityRoleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private FlashcardDeckRepository flashcardDeckRepository;

    private User admin;
    private User reviewer;
    private User anotherReviewer;
    private Subject subjectA;
    private Subject subjectB;
    private Document documentA;
    private Document documentB;
    private Quiz quizA;
    private FlashcardDeck deckB;

    @BeforeEach
    void setUp() {
        communityRoleRepository.deleteAll();
        flashcardDeckRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        reviewer = userRepository.save(User.builder()
                .email("reviewer@fpt.edu.vn")
                .fullName("Scoped Reviewer")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        anotherReviewer = userRepository.save(User.builder()
                .email("another@fpt.edu.vn")
                .fullName("Another Reviewer")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subjectA = subjectRepository.save(Subject.builder()
                .code("SWR302")
                .name("Software Requirements")
                .standardSemesterNumber(4)
                .build());

        subjectB = subjectRepository.save(Subject.builder()
                .code("SWP391")
                .name("Application Development Project")
                .standardSemesterNumber(5)
                .build());

        documentA = documentRepository.save(Document.builder()
                .user(reviewer)
                .subject(subjectA)
                .title("SWR302 Notes")
                .build());

        documentB = documentRepository.save(Document.builder()
                .user(reviewer)
                .subject(subjectB)
                .title("SWP391 Notes")
                .build());

        quizA = quizRepository.save(Quiz.builder()
                .creator(reviewer)
                .subject(subjectA)
                .title("SWR302 Quiz")
                .build());

        deckB = flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(reviewer)
                .subject(subjectB)
                .title("SWP391 Deck")
                .build());
    }

    @Test
    void subjectScopedReviewer_CanReviewDocumentInSameSubject() {
        saveRole(reviewer, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentA.getId()));
        assertFalse(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentB.getId()));
    }

    @Test
    void subjectScopedReviewer_CanReviewQuizInSameSubject() {
        saveRole(reviewer, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasReviewerPermissionForQuiz(reviewer.getId(), quizA.getId()));
        assertFalse(communityPermissionService.hasReviewerPermissionForFlashcardDeck(reviewer.getId(), deckB.getId()));
    }

    @Test
    void contentScopedReviewer_CanAccessOnlyExactDocument() {
        saveRole(reviewer, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.DOCUMENT, documentA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentA.getId()));
        assertFalse(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentB.getId()));
    }

    @Test
    void globalReviewer_CanAccessAllContentScopes() {
        saveRole(reviewer, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentA.getId()));
        assertTrue(communityPermissionService.hasReviewerPermissionForQuiz(reviewer.getId(), quizA.getId()));
        assertTrue(communityPermissionService.hasReviewerPermissionForFlashcardDeck(reviewer.getId(), deckB.getId()));
    }

    @Test
    void expiredOrRevokedRole_NoLongerGrantsPermission() {
        saveRole(reviewer, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(1), CommunityRoleStatus.ACTIVE);
        saveRole(anotherReviewer, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.REVOKED);

        assertFalse(communityPermissionService.hasReviewerPermissionForDocument(reviewer.getId(), documentA.getId()));
        assertFalse(communityPermissionService.hasReviewerPermissionForDocument(anotherReviewer.getId(), documentA.getId()));
    }

    @Test
    void admin_BypassesCommunityScopeChecks() {
        assertTrue(communityPermissionService.hasReviewerPermissionForDocument(admin.getId(), documentA.getId()));
        assertTrue(communityPermissionService.hasReviewerPermissionForQuiz(admin.getId(), quizA.getId()));
        assertTrue(communityPermissionService.hasReviewerPermissionForFlashcardDeck(admin.getId(), deckB.getId()));
        assertTrue(communityPermissionService.canModerateReport(admin.getId(),
                CommunityPermissionService.ContentTarget.document(documentA.getId())));
        assertTrue(communityPermissionService.canManageScope(admin.getId(), CommunityScopeType.DOCUMENT, documentA.getId()));
    }

    @Test
    void marketplaceReviewer_CanReviewButCannotModerateReport() {
        saveRole(reviewer, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.canReviewMarketplace(reviewer.getId(),
                CommunityPermissionService.ContentTarget.document(documentA.getId())));
        assertFalse(communityPermissionService.canModerateReport(reviewer.getId(),
                CommunityPermissionService.ContentTarget.document(documentA.getId())));
    }

    @Test
    void contentModerator_CanModerateOnlyWithinMatchingScope() {
        saveRole(reviewer, CommunityRoleType.CONTENT_MODERATOR, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.canModerateReport(reviewer.getId(),
                CommunityPermissionService.ContentTarget.document(documentA.getId())));
        assertTrue(communityPermissionService.canModerateReport(reviewer.getId(),
                CommunityPermissionService.ContentTarget.quiz(quizA.getId())));
        assertFalse(communityPermissionService.canModerateReport(reviewer.getId(),
                CommunityPermissionService.ContentTarget.flashcardDeck(deckB.getId())));
    }

    @Test
    void subjectModerator_CanManageContentInsideGrantedSubject() {
        saveRole(reviewer, CommunityRoleType.SUBJECT_MODERATOR, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.canManageScope(reviewer.getId(), CommunityScopeType.DOCUMENT, documentA.getId()));
        assertTrue(communityPermissionService.canManageScope(reviewer.getId(), CommunityScopeType.QUIZ, quizA.getId()));
        assertFalse(communityPermissionService.canManageScope(reviewer.getId(), CommunityScopeType.DOCUMENT, documentB.getId()));
    }

    @Test
    void hasActiveCommunityRole_UsesStartEndAndStatusChecks() {
        saveRole(reviewer, CommunityRoleType.CONTENT_MODERATOR, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);
        saveRole(anotherReviewer, CommunityRoleType.CONTENT_MODERATOR, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(1), CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasActiveCommunityRole(reviewer.getId(), CommunityRoleType.CONTENT_MODERATOR));
        assertFalse(communityPermissionService.hasActiveCommunityRole(anotherReviewer.getId(), CommunityRoleType.CONTENT_MODERATOR));
    }

    @Test
    void assertCanModerateReport_ThrowsWhenUserLacksModeratorScope() {
        saveRole(reviewer, CommunityRoleType.CONTENT_MODERATOR, CommunityScopeType.SUBJECT, subjectA.getId(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(5), CommunityRoleStatus.ACTIVE);

        assertThrows(AppException.class, () -> communityPermissionService.assertCanModerateReport(
                reviewer.getId(),
                CommunityPermissionService.ContentTarget.document(documentB.getId())));
    }

    private void saveRole(User user,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            CommunityRoleStatus status) {
        communityRoleRepository.save(CommunityRole.builder()
                .user(user)
                .grantedBy(admin)
                .roleType(roleType)
                .scopeType(scopeType)
                .scopeId(scopeId)
                .startAt(startAt)
                .endAt(endAt)
                .status(status)
                .build());
    }
}
