package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private User admin;
    private User alice;
    private User bob;
    private User carol;
    private User inactiveContributor;
    private User zeroContributor;

    @BeforeEach
    void setUp() {
        flashcardDeckRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        userRepository.deleteAll();

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
    void getContributorLeaderboard_ReturnsEmpty_WhenNoEligibleContributor() throws Exception {
        flashcardDeckRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        userRepository.deleteAll();

        saveUser("admin2@aistudyhub.com", "System Admin", Role.ADMIN, 1000, true);
        saveUser("inactive2@fpt.edu.vn", "Inactive User", Role.STUDENT, 0, false);
        saveUser("zero2@fpt.edu.vn", "Zero User", Role.STUDENT, 0, true);

        mockMvc.perform(get("/api/community/leaderboard/contributors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
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
}
