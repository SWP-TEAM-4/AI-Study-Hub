package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.enums.*;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.security.CustomUserDetailsService;
import com.aistudyhub.module.marketplace.dto.MarketReviewRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Test for Issue BE-046: Implement Reviewer Marketplace Queue.
 * Owner: BE3 (Task BE-046)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE046Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    @Autowired
    private MarketReviewRepository marketReviewRepository;

    @Autowired
    private CommunityRoleRepository communityRoleRepository;

    @Autowired
    private SubjectReviewPolicyRepository subjectReviewPolicyRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    private User adminUser;
    private User reviewer1;
    private User reviewer2;
    private User reviewer3;
    private User studentUser;
    private User creatorUser;
    private Subject subjectMath;
    private Subject subjectLiterature;

    private Document pendingDoc;
    private Quiz pendingQuiz;
    private FlashcardDeck pendingDeck;

    @BeforeEach
    void setUp() {
        // Clean database
        notificationRepository.deleteAll();
        marketReviewRepository.deleteAll();
        documentRepository.deleteAll();
        quizRepository.deleteAll();
        flashcardDeckRepository.deleteAll();
        communityRoleRepository.deleteAll();
        userRepository.deleteAll();
        subjectRepository.deleteAll();
        // 1. Create users
        adminUser = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        reviewer1 = userRepository.save(User.builder()
                .email("rev1@aistudyhub.com")
                .fullName("Reviewer One")
                .role(Role.REVIEWER)
                .isActive(true)
                .build());

        reviewer2 = userRepository.save(User.builder()
                .email("rev2@aistudyhub.com")
                .fullName("Reviewer Two")
                .role(Role.REVIEWER)
                .isActive(true)
                .build());

        reviewer3 = userRepository.save(User.builder()
                .email("rev3@aistudyhub.com")
                .fullName("Reviewer Three")
                .role(Role.REVIEWER)
                .isActive(true)
                .build());

        studentUser = userRepository.save(User.builder()
                .email("student@aistudyhub.com")
                .fullName("Student User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        creatorUser = userRepository.save(User.builder()
                .email("creator@aistudyhub.com")
                .fullName("Content Creator")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        // 2. Create subjects
        subjectMath = subjectRepository.save(Subject.builder()
                .code("MATH101")
                .name("Calculus I")
                .build());

        subjectLiterature = subjectRepository.save(Subject.builder()
                .code("LIT101")
                .name("Literature Introduction")
                .build());

        // These legacy BE-046 scenarios explicitly exercise multi-reviewer voting.
        // The production default is now SINGLE_REVIEWER; subjects only use the old
        // quorum behavior when an admin enables it.
        subjectReviewPolicyRepository.save(SubjectReviewPolicy.builder()
                .subject(subjectMath)
                .mode(ReviewPolicyMode.QUORUM)
                .requiredVotes(3)
                .approvalPercentage(70)
                .updatedBy(adminUser)
                .build());
        subjectReviewPolicyRepository.save(SubjectReviewPolicy.builder()
                .subject(subjectLiterature)
                .mode(ReviewPolicyMode.QUORUM)
                .requiredVotes(3)
                .approvalPercentage(70)
                .updatedBy(adminUser)
                .build());

        // 3. Create pending items
        pendingDoc = documentRepository.save(Document.builder()
                .user(creatorUser)
                .subject(subjectMath)
                .title("Calculus Exam Cheat Sheet")
                .description("Handwritten math formulas")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.PENDING)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        pendingQuiz = quizRepository.save(Quiz.builder()
                .creator(creatorUser)
                .subject(subjectMath)
                .title("Calculus Integration Quiz")
                .description("10 multiple choice questions")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.PENDING)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        pendingDeck = flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(creatorUser)
                .subject(subjectLiterature)
                .title("Romeo and Juliet Characters")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.PENDING)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());
    }

    private void assignRole(User user, CommunityRoleType roleType, CommunityScopeType scopeType, Long scopeId) {
        communityRoleRepository.save(CommunityRole.builder()
                .user(user)
                .grantedBy(adminUser)
                .roleType(roleType)
                .scopeType(scopeType)
                .scopeId(scopeId)
                .startAt(LocalDateTime.now().minusDays(1))
                .endAt(LocalDateTime.now().plusDays(10))
                .status(CommunityRoleStatus.ACTIVE)
                .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Pending Queue Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void getPendingQueue_Success_Admin() throws Exception {
        mockMvc.perform(get("/api/reviewer/marketplace/pending")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))))
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.totalElements").value(3));
    }

    @Test
    void getPendingQueue_Success_ScopedReviewer() throws Exception {
        // Reviewer 1 only assigned to Math
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectMath.getId());

        mockMvc.perform(get("/api/reviewer/marketplace/pending")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2)) // doc, quiz
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void getPendingQueue_Forbidden_Student() throws Exception {
        mockMvc.perform(get("/api/reviewer/marketplace/pending")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(studentUser,
                        List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Item Detail Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void getItemDetail_Success() throws Exception {
        // Reviewer 1 has role for Math
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectMath.getId());

        mockMvc.perform(get("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId())
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.targetType").value("DOCUMENT"))
                .andExpect(jsonPath("$.data.targetId").value(pendingDoc.getId()))
                .andExpect(jsonPath("$.data.title").value("Calculus Exam Cheat Sheet"));
    }

    @Test
    void getItemDetail_Forbidden_OutsideScope() throws Exception {
        // Reviewer 1 only assigned to Math. Deck is Literature.
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectMath.getId());

        mockMvc.perform(get("/api/reviewer/marketplace/FLASHCARD_DECK/" + pendingDeck.getId())
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER"))))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMUNITY_ROLE_PERMISSION_DENIED"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Vote Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void vote_Success_RemainsPendingIfNotEnoughVotes() throws Exception {
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

        MarketReviewRequest request = MarketReviewRequest.builder()
                .voteResult("APPROVED")
                .reviewNote("Well prepared cheat sheet")
                .build();

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.voteResult").value("APPROVED"));

        // Verify document is still PENDING because this subject uses a 3-vote quorum.
        Document docInDb = documentRepository.findById(pendingDoc.getId()).orElseThrow();
        assertEquals(MarketStatus.PENDING, docInDb.getMarketStatus());
        assertEquals(1, docInDb.getReviewCount());
        assertEquals(0, docInDb.getAcceptPercentage().compareTo(BigDecimal.valueOf(100.00)));
    }

    @Test
    void vote_Fail_DuplicateVote() throws Exception {
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

        MarketReviewRequest request = MarketReviewRequest.builder()
                .voteResult("APPROVED")
                .reviewNote("Note")
                .build();

        // First vote
        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Second vote -> Should Fail
        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void vote_AutoApprove_Success() throws Exception {
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);
        assignRole(reviewer2, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);
        assignRole(reviewer3, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

        MarketReviewRequest approveReq = MarketReviewRequest.builder()
                .voteResult("APPROVED")
                .reviewNote("Ok")
                .build();

        // 3 reviewers vote APPROVED
        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer2,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer3,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        // Verify document is now APPROVED and visibility is MARKETPLACE
        Document docInDb = documentRepository.findById(pendingDoc.getId()).orElseThrow();
        assertEquals(MarketStatus.APPROVED, docInDb.getMarketStatus());
        assertEquals(Visibility.MARKETPLACE, docInDb.getVisibility());
        assertEquals(3, docInDb.getReviewCount());

        // Verify Notification was sent to creator
        List<Notification> notifications = notificationRepository.findAll();
        assertFalse(notifications.isEmpty());
        boolean hasApprovedNotification = notifications.stream()
                .anyMatch(n -> n.getUser().getId().equals(creatorUser.getId()) && n.getTitle().contains("approved"));
        assertTrue(hasApprovedNotification);
    }

    @Test
    void vote_AutoReject_Success() throws Exception {
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);
        assignRole(reviewer2, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);
        assignRole(reviewer3, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

        MarketReviewRequest approveReq = MarketReviewRequest.builder().voteResult("APPROVED").build();
        MarketReviewRequest rejectReq = MarketReviewRequest.builder().voteResult("REJECTED").build();

        // 1 APPROVED, 2 REJECTED -> Accept Pct = 33.33% < 70%
        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer2,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + pendingDoc.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer3,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk());

        // Verify document is now REJECTED
        Document docInDb = documentRepository.findById(pendingDoc.getId()).orElseThrow();
        assertEquals(MarketStatus.REJECTED, docInDb.getMarketStatus());

        // Verify Notification was sent to creator
        List<Notification> notifications = notificationRepository.findAll();
        assertFalse(notifications.isEmpty());
        boolean hasRejectedNotification = notifications.stream()
                .anyMatch(n -> n.getUser().getId().equals(creatorUser.getId()) && n.getTitle().contains("rejected"));
        assertTrue(hasRejectedNotification);
    }

    @Test
    void defaultPolicy_OneScopedReviewerApprovesImmediately() throws Exception {
        Subject defaultSubject = subjectRepository.save(Subject.builder()
                .code("PHY101")
                .name("Physics I")
                .build());
        Document document = documentRepository.save(Document.builder()
                .user(creatorUser)
                .subject(defaultSubject)
                .title("Physics summary")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.PENDING)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());
        assignRole(reviewer1, CommunityRoleType.MARKETPLACE_REVIEWER,
                CommunityScopeType.SUBJECT, defaultSubject.getId());

        MarketReviewRequest request = MarketReviewRequest.builder().voteResult("APPROVED").build();
        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + document.getId() + "/vote")
                // The real user-details loader derives ROLE_REVIEWER from the active community role.
                .with(SecurityMockMvcRequestPostProcessors.user(
                        customUserDetailsService.loadUserById(reviewer1.getId())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requiredVotes").value(1))
                .andExpect(jsonPath("$.data.decisionReached").value(true))
                .andExpect(jsonPath("$.data.submissionStatus").value("APPROVED"));

        Document saved = documentRepository.findById(document.getId()).orElseThrow();
        assertEquals(MarketStatus.APPROVED, saved.getMarketStatus());
        assertEquals(Visibility.MARKETPLACE, saved.getVisibility());
    }

    @Test
    void reviewerCannotSelfApprove_ButAnotherSubjectReviewerCan() throws Exception {
        Subject defaultSubject = subjectRepository.save(Subject.builder()
                .code("CHEM101")
                .name("Chemistry I")
                .build());
        Document selfOwned = documentRepository.save(Document.builder()
                .user(reviewer1)
                .subject(defaultSubject)
                .title("Chemistry summary")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.PENDING)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());
        assignRole(reviewer1, CommunityRoleType.MARKETPLACE_REVIEWER,
                CommunityScopeType.SUBJECT, defaultSubject.getId());
        assignRole(reviewer2, CommunityRoleType.MARKETPLACE_REVIEWER,
                CommunityScopeType.SUBJECT, defaultSubject.getId());
        MarketReviewRequest request = MarketReviewRequest.builder().voteResult("APPROVED").build();

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + selfOwned.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(
                        customUserDetailsService.loadUserById(reviewer1.getId())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/reviewer/marketplace/DOCUMENT/" + selfOwned.getId() + "/vote")
                .with(SecurityMockMvcRequestPostProcessors.user(
                        customUserDetailsService.loadUserById(reviewer2.getId())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submissionStatus").value("APPROVED"));
    }

    @Test
    void adminCanSwitchSubjectFromDefaultToQuorumPolicy() throws Exception {
        Subject subject = subjectRepository.save(Subject.builder().code("BIO101").name("Biology I").build());
        CustomUserDetails admin = new CustomUserDetails(adminUser,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        mockMvc.perform(get("/api/admin/marketplace/review-policies/" + subject.getId())
                .with(SecurityMockMvcRequestPostProcessors.user(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("SINGLE_REVIEWER"))
                .andExpect(jsonPath("$.data.subjectOverride").value(false));

        mockMvc.perform(put("/api/admin/marketplace/review-policies/" + subject.getId())
                .with(SecurityMockMvcRequestPostProcessors.user(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"mode\":\"QUORUM\",\"requiredVotes\":3,\"approvalPercentage\":70}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("QUORUM"))
                .andExpect(jsonPath("$.data.requiredVotes").value(3))
                .andExpect(jsonPath("$.data.approvalPercentage").value(70))
                .andExpect(jsonPath("$.data.subjectOverride").value(true));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Admin Override Tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void adminApprove_Success_Override() throws Exception {
        mockMvc.perform(patch("/api/admin/marketplace/QUIZ/" + pendingQuiz.getId() + "/approve")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.voteResult").value("APPROVED"));

        Quiz quizInDb = quizRepository.findById(pendingQuiz.getId()).orElseThrow();
        assertEquals(MarketStatus.APPROVED, quizInDb.getMarketStatus());
        assertEquals(Visibility.MARKETPLACE, quizInDb.getVisibility());
    }

    @Test
    void adminApprove_Forbidden_Reviewer() throws Exception {
        assignRole(reviewer1, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

        mockMvc.perform(patch("/api/admin/marketplace/QUIZ/" + pendingQuiz.getId() + "/approve")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewer1,
                        List.of(new SimpleGrantedAuthority("ROLE_REVIEWER"))))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminReject_Success_Override() throws Exception {
        mockMvc.perform(patch("/api/admin/marketplace/FLASHCARD_DECK/" + pendingDeck.getId() + "/reject")
                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.voteResult").value("REJECTED"));

        FlashcardDeck deckInDb = flashcardDeckRepository.findById(pendingDeck.getId()).orElseThrow();
        assertEquals(MarketStatus.REJECTED, deckInDb.getMarketStatus());
    }
}
