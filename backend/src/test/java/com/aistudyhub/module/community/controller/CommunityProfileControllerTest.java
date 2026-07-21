package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Badge;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.MarketReview;
import com.aistudyhub.entity.ReputationEvent;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserBadge;
import com.aistudyhub.repository.BadgeRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.MarketReviewRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.ReputationEventRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CommunityProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
    private ReputationEventRepository reputationEventRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private UserBadgeRepository userBadgeRepository;

    private User contributor;
    private User reviewer;
    private Subject swp;
    private Document approvedDocument;

    @BeforeEach
    void setUp() {
        clearDomainData();

        contributor = userRepository.save(User.builder()
                .email("profile-contributor@fpt.edu.vn")
                .fullName("Profile Contributor")
                .role(Role.STUDENT)
                .reputationPoints(180)
                .isActive(true)
                .build());
        reviewer = userRepository.save(User.builder()
                .email("profile-reviewer@fpt.edu.vn")
                .fullName("Profile Reviewer")
                .role(Role.STUDENT)
                .reputationPoints(90)
                .isActive(true)
                .build());
        swp = subjectRepository.save(Subject.builder()
                .code("SWP391")
                .name("Software Project")
                .build());
        Subject prn = subjectRepository.save(Subject.builder()
                .code("PRN212")
                .name("Advanced .NET")
                .build());

        Badge badge = badgeRepository.save(Badge.builder()
                .name("Top Contributor")
                .description("Đóng góp nổi bật")
                .iconUrl("/badges/top-contributor.png")
                .build());
        userBadgeRepository.save(UserBadge.builder()
                .user(contributor)
                .badge(badge)
                .build());

        reputationEventRepository.save(ReputationEvent.builder()
                .user(contributor)
                .subject(swp)
                .eventType(ReputationEventType.CONTENT_APPROVED_DOCUMENT)
                .targetType("DOCUMENT")
                .targetId(101L)
                .pointsDelta(60)
                .reason("Approved quality document")
                .idempotencyKey("community-profile-swp-1")
                .periodKey(YearMonth.now().toString())
                .build());
        reputationEventRepository.save(ReputationEvent.builder()
                .user(contributor)
                .subject(prn)
                .eventType(ReputationEventType.COMMUNITY_REVIEW_GOOD)
                .targetType("DOCUMENT")
                .targetId(102L)
                .pointsDelta(20)
                .reason("Good community review")
                .idempotencyKey("community-profile-prn-1")
                .periodKey(YearMonth.now().toString())
                .build());

        approvedDocument = documentRepository.save(Document.builder()
                .user(contributor)
                .subject(swp)
                .title("Approved SWP document")
                .visibility(Visibility.MARKETPLACE)
                .marketStatus(MarketStatus.APPROVED)
                .downloadCount(12)
                .communityReviewCount(4)
                .communityRatingAvg(new BigDecimal("4.50"))
                .build());
        documentRepository.save(Document.builder()
                .user(contributor)
                .subject(swp)
                .title("Private draft")
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .build());

        marketReviewRepository.save(MarketReview.builder()
                .reviewer(contributor)
                .document(approvedDocument)
                .rating(5)
                .reviewNote("Rất hữu ích cho môn SWP.")
                .build());
        marketReviewRepository.save(MarketReview.builder()
                .reviewer(reviewer)
                .document(approvedDocument)
                .voteResult("APPROVED")
                .rating(5)
                .reviewNote("Reviewer vote should not appear in public history")
                .build());
    }

    @Test
    void getPublicProfile_ReturnsBadgesTopSubjectsContributionsAndPublicReviews() throws Exception {
        mockMvc.perform(get("/api/community/users/{userId}/profile", contributor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(contributor.getId()))
                .andExpect(jsonPath("$.data.fullName").value("Profile Contributor"))
                .andExpect(jsonPath("$.data.reputationPoints").value(180))
                .andExpect(jsonPath("$.data.badges[0].name").value("Top Contributor"))
                .andExpect(jsonPath("$.data.topSubjects[0].subjectCode").value("SWP391"))
                .andExpect(jsonPath("$.data.topSubjects[0].score").value(60))
                .andExpect(jsonPath("$.data.contributions.length()").value(1))
                .andExpect(jsonPath("$.data.contributions[0].targetType").value("DOCUMENT"))
                .andExpect(jsonPath("$.data.contributions[0].title").value("Approved SWP document"))
                .andExpect(jsonPath("$.data.contributions[0].downloadCount").value(12))
                .andExpect(jsonPath("$.data.contributions[0].communityReviewCount").value(4))
                .andExpect(jsonPath("$.data.reviewHistory.length()").value(1))
                .andExpect(jsonPath("$.data.reviewHistory[0].targetTitle").value("Approved SWP document"))
                .andExpect(jsonPath("$.data.reviewHistory[0].rating").value(5));
    }

    @Test
    void getPublicProfile_ReturnsNotFound_WhenUserInactive() throws Exception {
        User inactive = userRepository.save(User.builder()
                .email("profile-inactive@fpt.edu.vn")
                .fullName("Inactive Profile")
                .role(Role.STUDENT)
                .reputationPoints(999)
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/community/users/{userId}/profile", inactive.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    private void clearDomainData() {
        marketReviewRepository.deleteAll();
        reputationEventRepository.deleteAll();
        userBadgeRepository.deleteAll();
        badgeRepository.deleteAll();
        flashcardDeckRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();
    }
}
