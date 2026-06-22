package com.aistudyhub.module.marketplace.controller;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration Test for Issue BE-030: Implement Market Review APIs.
 * Owner: BE3 (Task BE-030)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE030Test {

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

        private User adminUser;
        private User reviewerUser;
        private User studentUser;
        private User creatorUser;
        private Subject subjectSWR;
        private Subject subjectOther;

        private Document pendingDoc;
        private Document approvedDoc;
        private Quiz pendingQuiz;
        private FlashcardDeck pendingDeck;

        @BeforeEach
        void setUp() {
                // Clean database
                marketReviewRepository.deleteAll();
                documentRepository.deleteAll();
                quizRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                communityRoleRepository.deleteAll();
                userRepository.deleteAll();
                subjectRepository.deleteAll();

                // Create users
                adminUser = userRepository.save(User.builder()
                                .email("admin@aistudyhub.com")
                                .fullName("Admin User")
                                .role(Role.ADMIN)
                                .isActive(true)
                                .build());

                reviewerUser = userRepository.save(User.builder()
                                .email("reviewer@aistudyhub.com")
                                .fullName("Reviewer User")
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
                                .fullName("Creator User")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // Create subjects
                subjectSWR = subjectRepository.save(Subject.builder()
                                .code("SWR302")
                                .name("Software Requirement")
                                .build());

                subjectOther = subjectRepository.save(Subject.builder()
                                .code("PRF192")
                                .name("Programming Fundamentals")
                                .build());

                // Create pending document
                pendingDoc = documentRepository.save(Document.builder()
                                .user(creatorUser)
                                .subject(subjectSWR)
                                .title("Pending SWR Document")
                                .description("Document description")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.PENDING)
                                .downloadCount(0)
                                .reviewCount(0)
                                .acceptPercentage(BigDecimal.ZERO)
                                .build());

                // Create approved document (should not appear in pending list)
                approvedDoc = documentRepository.save(Document.builder()
                                .user(creatorUser)
                                .subject(subjectSWR)
                                .title("Approved SWR Document")
                                .description("Approved description")
                                .visibility(Visibility.MARKETPLACE)
                                .marketStatus(MarketStatus.APPROVED)
                                .downloadCount(5)
                                .reviewCount(1)
                                .acceptPercentage(BigDecimal.valueOf(100.00))
                                .build());

                // Create pending quiz
                pendingQuiz = quizRepository.save(Quiz.builder()
                                .creator(creatorUser)
                                .subject(subjectSWR)
                                .title("Pending SWR Quiz")
                                .description("Quiz description")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.PENDING)
                                .downloadCount(0)
                                .reviewCount(0)
                                .acceptPercentage(BigDecimal.ZERO)
                                .build());

                // Create pending deck
                pendingDeck = flashcardDeckRepository.save(FlashcardDeck.builder()
                                .user(creatorUser)
                                .subject(subjectOther)
                                .title("Pending PRF Deck")
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

        @Test
        void getPendingQueue_Success_Admin() throws Exception {
                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(3)) // pendingDoc, pendingQuiz, pendingDeck
                                .andExpect(jsonPath("$.data.totalElements").value(3));
        }

        @Test
        void getPendingQueue_Success_Reviewer_NoRoles_ReturnsEmpty() throws Exception {
                // Reviewer has no roles assigned -> should see 0 pending items
                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(0))
                                .andExpect(jsonPath("$.data.totalElements").value(0));
        }

        @Test
        void getPendingQueue_Success_Reviewer_Global() throws Exception {
                // Reviewer with GLOBAL reviewer role -> should see all 3 pending items
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(3))
                                .andExpect(jsonPath("$.data.totalElements").value(3));
        }

        @Test
        void getPendingQueue_Success_Reviewer_SubjectSWROnly() throws Exception {
                // Reviewer only assigned to SWR302 subject -> should see 2 items (pendingDoc, pendingQuiz)
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectSWR.getId());

                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(2))
                                .andExpect(jsonPath("$.data.totalElements").value(2));
        }

        @Test
        void getPendingQueue_Forbidden_Student() throws Exception {
                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(studentUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
        }

        @Test
        void getPendingQueue_WithSubjectFilter_ShouldFilterCorrectly() throws Exception {
                // Give global reviewer role so they can search all subjects
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .param("subjectId", subjectOther.getId().toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].targetType").value("FLASHCARD_DECK"))
                                .andExpect(jsonPath("$.data.items[0].targetId").value(pendingDeck.getId()));
        }

        @Test
        void getPendingQueue_WithKeywordFilter_ShouldFilterCorrectly() throws Exception {
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL, null);

                mockMvc.perform(get("/api/admin/marketplace/pending")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .param("keyword", "Quiz"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].targetType").value("QUIZ"))
                                .andExpect(jsonPath("$.data.items[0].title").value("Pending SWR Quiz"));
        }

        @Test
        void reviewDocument_Approve_Success_ScopedReviewer() throws Exception {
                // Reviewer is scoped to SWR302
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectSWR.getId());

                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Perfect document content")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/documents/" + pendingDoc.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.voteResult").value("APPROVED"))
                                .andExpect(jsonPath("$.data.targetType").value("DOCUMENT"))
                                .andExpect(jsonPath("$.data.targetId").value(pendingDoc.getId()));

                // Verify status in DB
                Document docInDb = documentRepository.findById(pendingDoc.getId()).orElseThrow();
                assertEquals(MarketStatus.APPROVED, docInDb.getMarketStatus());
                assertEquals(Visibility.MARKETPLACE, docInDb.getVisibility());
        }

        @Test
        void reviewDocument_Approve_Forbidden_OutsideScope() throws Exception {
                // Reviewer is scoped to SWR302, but pendingDoc is under SWR302 so it works.
                // However, pendingDeck is under subjectOther (PRF192). Let's test reviewing pendingDeck (under PRF192).
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectSWR.getId());

                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Nice cards")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/flashcard-decks/" + pendingDeck.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("COMMUNITY_ROLE_PERMISSION_DENIED"));
        }

        @Test
        void reviewDocument_InvalidVoteResult_ShouldReturnValidationError() throws Exception {
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectSWR.getId());

                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("INVALID_VOTE")
                                .reviewNote("Note")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/documents/" + pendingDoc.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void reviewQuiz_Reject_Success_AdminBypassesScope() throws Exception {
                // Admin has global bypass, does not need community roles.
                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("REJECTED")
                                .reviewNote("Duplicate questions found")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/quizzes/" + pendingQuiz.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.voteResult").value("REJECTED"));

                // Verify status in DB
                Quiz quizInDb = quizRepository.findById(pendingQuiz.getId()).orElseThrow();
                assertEquals(MarketStatus.REJECTED, quizInDb.getMarketStatus());
        }

        @Test
        void reviewDeck_Approve_Success() throws Exception {
                // Reviewer assigned to PRF192 (subjectOther)
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectOther.getId());

                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Flashcards are well-organized")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/flashcard-decks/" + pendingDeck.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.voteResult").value("APPROVED"));

                // Verify status in DB
                FlashcardDeck deckInDb = flashcardDeckRepository.findById(pendingDeck.getId()).orElseThrow();
                assertEquals(MarketStatus.APPROVED, deckInDb.getMarketStatus());
        }

        @Test
        void reviewQuiz_NotFound_ShouldReturn404() throws Exception {
                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Note")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/quizzes/99999/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(adminUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("QUIZ_NOT_FOUND"));
        }

        @Test
        void reviewDocument_NotPending_ShouldReturnValidationError() throws Exception {
                assignRole(reviewerUser, CommunityRoleType.REVIEWER, CommunityScopeType.SUBJECT, subjectSWR.getId());

                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Note")
                                .build();

                // approvedDoc is already APPROVED (not PENDING)
                mockMvc.perform(post("/api/admin/marketplace/documents/" + approvedDoc.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(reviewerUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_REVIEWER")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void reviewDeck_Forbidden_Student() throws Exception {
                MarketReviewRequest request = MarketReviewRequest.builder()
                                .voteResult("APPROVED")
                                .reviewNote("Note")
                                .build();

                mockMvc.perform(post("/api/admin/marketplace/flashcard-decks/" + pendingDeck.getId() + "/review")
                                .with(SecurityMockMvcRequestPostProcessors.user(new CustomUserDetails(studentUser,
                                                 List.of(new SimpleGrantedAuthority("ROLE_STUDENT")))))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
        }
}
