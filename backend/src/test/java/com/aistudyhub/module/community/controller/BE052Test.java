package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Badge;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.MarketReview;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.dto.ReferralResponse;
import com.aistudyhub.module.community.service.ReferralService;
import com.aistudyhub.module.community.service.RewardBadgeService;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.repository.BadgeRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.MarketReviewRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.ReferralRepository;
import com.aistudyhub.repository.SystemConfigRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE052Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private FlashcardDeckRepository flashcardDeckRepository;

    @Autowired
    private ReferralRepository referralRepository;

    @Autowired
    private ReferralService referralService;

    @Autowired
    private RewardBadgeService rewardBadgeService;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private UserBadgeRepository userBadgeRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private MarketReviewRepository marketReviewRepository;

    private User admin;
    private User alice;
    private User bob;
    private User carol;
    private User inactiveContributor;
    private User zeroContributor;

    @BeforeEach
    void setUp() {
        clearDomainData();
        systemConfigRepository.deleteAll();
        seedGrowthConfigs();

        admin = saveUser("admin@aistudyhub.com", "System Admin", Role.ADMIN, 999, true);
        alice = saveUser("alice@fpt.edu.vn", "Alice", Role.STUDENT, 120, true);
        bob = saveUser("bob@fpt.edu.vn", "Bob", Role.STUDENT, 120, true);
        carol = saveUser("carol@fpt.edu.vn", "Carol", Role.STUDENT, 80, true);
        inactiveContributor = saveUser("inactive@fpt.edu.vn", "Inactive User", Role.STUDENT, 500, false);
        zeroContributor = saveUser("zero@fpt.edu.vn", "Zero User", Role.STUDENT, 0, true);
    }

    @Test
    void getContributorLeaderboard_PublicSuccess_WithRankingAndAggregation() throws Exception {
        saveDocument(admin, "Admin document", 999, 999, "99.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);

        saveDocument(alice, "Alice document", 20, 6, "90.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);
        saveQuiz(alice, "Alice quiz", 5, 2, "80.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);
        saveDocument(alice, "Alice private document", 200, 200, "100.00", Visibility.PRIVATE, MarketStatus.APPROVED);

        saveDeck(bob, "Bob deck", 30, 1, "70.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);
        saveDeck(bob, "Bob pending deck", 999, 999, "100.00", Visibility.MARKETPLACE, MarketStatus.PENDING);

        saveDocument(carol, "Carol document", 10, 10, "100.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);

        saveDocument(inactiveContributor, "Inactive document", 500, 500, "100.00",
                Visibility.MARKETPLACE, MarketStatus.APPROVED);

        mockMvc.perform(get("/api/community/leaderboard/contributors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.items[0].rank").value(1))
                .andExpect(jsonPath("$.data.items[0].userId").value(bob.getId()))
                .andExpect(jsonPath("$.data.items[0].fullName").value("Bob"))
                .andExpect(jsonPath("$.data.items[0].approvedContents").value(1))
                .andExpect(jsonPath("$.data.items[0].downloadCount").value(30))
                .andExpect(jsonPath("$.data.items[1].rank").value(2))
                .andExpect(jsonPath("$.data.items[1].userId").value(alice.getId()))
                .andExpect(jsonPath("$.data.items[1].approvedContents").value(2))
                .andExpect(jsonPath("$.data.items[1].downloadCount").value(25))
                .andExpect(jsonPath("$.data.items[1].reviewCount").value(8))
                .andExpect(jsonPath("$.data.items[2].rank").value(3))
                .andExpect(jsonPath("$.data.items[2].userId").value(carol.getId()));
    }

    @Test
    void getContributorLeaderboard_PaginationKeepsGlobalRank() throws Exception {
        saveDocument(alice, "Alice document", 20, 6, "90.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);
        saveDeck(bob, "Bob deck", 30, 1, "70.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);
        saveDocument(carol, "Carol document", 10, 10, "100.00", Visibility.MARKETPLACE, MarketStatus.APPROVED);

        mockMvc.perform(get("/api/community/leaderboard/contributors")
                        .param("page", "1")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].rank").value(3))
                .andExpect(jsonPath("$.data.items[0].userId").value(carol.getId()));
    }

    @Test
    void getContributorLeaderboard_AwardsTopContributorBadgeOnlyForConfiguredTop10() throws Exception {
        clearDomainData();
        saveUser("admin-top10@aistudyhub.com", "System Admin", Role.ADMIN, 9999, true);

        List<User> rankedUsers = new ArrayList<>();
        for (int i = 1; i <= 11; i++) {
            User user = saveUser("rank" + i + "@fpt.edu.vn", "Rank " + i, Role.STUDENT, 1000 - i, true);
            saveDocument(user, "Rank " + i + " document", 20 - i, 1, "100.00",
                    Visibility.MARKETPLACE, MarketStatus.APPROVED);
            rankedUsers.add(user);
        }

        mockMvc.perform(get("/api/community/leaderboard/contributors")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(11))
                .andExpect(jsonPath("$.data.items[0].rank").value(1))
                .andExpect(jsonPath("$.data.items[9].rank").value(10))
                .andExpect(jsonPath("$.data.items[10].rank").value(11));

        for (int i = 0; i < 10; i++) {
            assertUserHasBadge(rankedUsers.get(i).getId(), "Top Contributor");
        }
        assertUserDoesNotHaveBadge(rankedUsers.get(10).getId(), "Top Contributor");
    }

    @Test
    void getContributorLeaderboard_ReturnsEmpty_WhenNoEligibleContributor() throws Exception {
        clearDomainData();

        saveUser("admin2@aistudyhub.com", "System Admin", Role.ADMIN, 1000, true);
        saveUser("inactive2@fpt.edu.vn", "Inactive User", Role.STUDENT, 0, false);
        saveUser("zero2@fpt.edu.vn", "Zero User", Role.STUDENT, 0, true);

        mockMvc.perform(get("/api/community/leaderboard/contributors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void getMyReferral_AuthenticatedUser_CreatesStableReferralCode() throws Exception {
        mockMvc.perform(get("/api/referrals/me")
                        .with(user(userDetails(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.rewardPoints").value(0));

        assertEquals(1L, referralRepository.count());

        String firstCode = referralRepository.findByOwner_Id(alice.getId()).orElseThrow().getCode();

        mockMvc.perform(get("/api/referrals/me")
                        .with(user(userDetails(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(firstCode));

        assertEquals(1L, referralRepository.count());
    }

    @Test
    void applyReferral_Success_RewardsCurrentUserAndReferrerOnce() throws Exception {
        ReferralResponse bobReferral = referralService.getMyReferral(bob.getId());

        mockMvc.perform(post("/api/referrals/apply")
                        .with(user(userDetails(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "referralCode": "%s"
                                }
                                """.formatted(bobReferral.getCode())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value(
                        referralRepository.findByOwner_Id(alice.getId()).orElseThrow().getCode()))
                .andExpect(jsonPath("$.data.appliedByUserId").value(alice.getId()))
                .andExpect(jsonPath("$.data.status").value("APPLIED"))
                .andExpect(jsonPath("$.data.rewardPoints").value(35));

        assertEquals(155, userRepository.findById(alice.getId()).orElseThrow().getReputationPoints());
        assertEquals(155, userRepository.findById(bob.getId()).orElseThrow().getReputationPoints());
        assertUserHasBadge(alice.getId(), "Referral Starter");
        assertUserHasBadge(bob.getId(), "Referral Ambassador");
        assertUserHasBadge(alice.getId(), "Reputation Milestone");
        assertUserHasBadge(bob.getId(), "Reputation Milestone");
    }

    @Test
    void applyReferral_ReturnsConflict_WhenUserAlreadyAppliedReferral() throws Exception {
        ReferralResponse bobReferral = referralService.getMyReferral(bob.getId());
        ReferralResponse carolReferral = referralService.getMyReferral(carol.getId());

        mockMvc.perform(post("/api/referrals/apply")
                        .with(user(userDetails(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "referralCode": "%s"
                                }
                                """.formatted(bobReferral.getCode())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/referrals/apply")
                        .with(user(userDetails(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "referralCode": "%s"
                                }
                                """.formatted(carolReferral.getCode())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("REFERRAL_ALREADY_APPLIED"));
    }

    @Test
    void applyReferral_ReturnsBadRequest_WhenApplyingOwnCode() throws Exception {
        ReferralResponse aliceReferral = referralService.getMyReferral(alice.getId());

        mockMvc.perform(post("/api/referrals/apply")
                        .with(user(userDetails(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "referralCode": "%s"
                                }
                                """.formatted(aliceReferral.getCode())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("REFERRAL_SELF_APPLY"));
    }

    @Test
    void applyReferral_ReturnsBadRequest_WhenCodeDoesNotExist() throws Exception {
        mockMvc.perform(post("/api/referrals/apply")
                        .with(user(userDetails(alice)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "referralCode": "UNKNOWN2026"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("REFERRAL_CODE_INVALID"));
    }

    @Test
    void awardReviewerBadges_AssignsTopReviewer_WhenConfiguredReviewThresholdReached() {
        marketReviewRepository.save(MarketReview.builder()
                .reviewer(alice)
                .voteResult("APPROVED")
                .build());
        marketReviewRepository.save(MarketReview.builder()
                .reviewer(alice)
                .voteResult("REJECTED")
                .build());

        rewardBadgeService.awardReviewerBadges(alice);
        rewardBadgeService.awardReviewerBadges(alice);

        assertUserHasBadge(alice.getId(), "Top Reviewer");
        Badge badge = badgeRepository.findFirstByNameIgnoreCaseOrderByIdAsc("Top Reviewer").orElseThrow();
        assertEquals(1L, userBadgeRepository.findAllByUser_IdOrderByEarnedAtDescIdDesc(alice.getId()).stream()
                .filter(userBadge -> userBadge.getBadge().getId().equals(badge.getId()))
                .count());
    }

    private void clearDomainData() {
        marketReviewRepository.deleteAll();
        userBadgeRepository.deleteAll();
        badgeRepository.deleteAll();
        referralRepository.deleteAll();
        flashcardDeckRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        userRepository.deleteAll();
    }

    private void seedGrowthConfigs() {
        saveSystemConfig(SystemConfigKeys.GROWTH_REFERRAL_REWARD_POINTS, "35");
        saveSystemConfig(SystemConfigKeys.GROWTH_TOP_CONTRIBUTOR_LIMIT, "10");
        saveSystemConfig(SystemConfigKeys.GROWTH_REFERRAL_AMBASSADOR_INVITES, "1");
        saveSystemConfig(SystemConfigKeys.REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS, "2");
        saveSystemConfig(SystemConfigKeys.REWARD_POPULAR_CREATOR_DOWNLOADS, "25");
        saveSystemConfig(SystemConfigKeys.REWARD_TOP_REVIEWER_REVIEWS, "2");
        saveSystemConfig(SystemConfigKeys.REWARD_REPUTATION_MILESTONE_POINTS, "100");
    }

    private void saveSystemConfig(String key, String value) {
        systemConfigRepository.save(SystemConfig.builder()
                .configKey(key)
                .configValue(value)
                .description("BE-052 test config")
                .isPublic(false)
                .build());
    }

    private void assertUserHasBadge(Long userId, String badgeName) {
        Badge badge = badgeRepository.findFirstByNameIgnoreCaseOrderByIdAsc(badgeName).orElseThrow();
        assertTrue(userBadgeRepository.existsByUser_IdAndBadge_Id(userId, badge.getId()),
                () -> "Expected userId=" + userId + " to have badge " + badgeName);
    }

    private void assertUserDoesNotHaveBadge(Long userId, String badgeName) {
        badgeRepository.findFirstByNameIgnoreCaseOrderByIdAsc(badgeName)
                .ifPresent(badge -> assertFalse(
                        userBadgeRepository.existsByUser_IdAndBadge_Id(userId, badge.getId()),
                        () -> "Expected userId=" + userId + " not to have badge " + badgeName));
    }

    private User saveUser(String email, String fullName, Role role, int reputationPoints, boolean isActive) {
        return userRepository.save(User.builder()
                .email(email)
                .fullName(fullName)
                .role(role)
                .reputationPoints(reputationPoints)
                .isActive(isActive)
                .build());
    }

    private Document saveDocument(User owner, String title, int downloadCount, int reviewCount, String acceptPercentage,
            Visibility visibility, MarketStatus marketStatus) {
        return documentRepository.save(Document.builder()
                .user(owner)
                .title(title)
                .visibility(visibility)
                .marketStatus(marketStatus)
                .downloadCount(downloadCount)
                .reviewCount(reviewCount)
                .acceptPercentage(new BigDecimal(acceptPercentage))
                .build());
    }

    private Quiz saveQuiz(User creator, String title, int downloadCount, int reviewCount, String acceptPercentage,
            Visibility visibility, MarketStatus marketStatus) {
        return quizRepository.save(Quiz.builder()
                .creator(creator)
                .title(title)
                .visibility(visibility)
                .marketStatus(marketStatus)
                .downloadCount(downloadCount)
                .reviewCount(reviewCount)
                .acceptPercentage(new BigDecimal(acceptPercentage))
                .build());
    }

    private FlashcardDeck saveDeck(User owner, String title, int downloadCount, int reviewCount, String acceptPercentage,
            Visibility visibility, MarketStatus marketStatus) {
        return flashcardDeckRepository.save(FlashcardDeck.builder()
                .user(owner)
                .title(title)
                .visibility(visibility)
                .marketStatus(marketStatus)
                .downloadCount(downloadCount)
                .reviewCount(reviewCount)
                .acceptPercentage(new BigDecimal(acceptPercentage))
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
