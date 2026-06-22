package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.*;
import com.aistudyhub.repository.*;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE042Test {

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
        private MarketReviewRepository marketReviewRepository;

        @Autowired
        private jakarta.persistence.EntityManager entityManager;

        private User user1;
        private User user2;
        private Document doc1;
        private Quiz quiz1;

        @BeforeEach
        void setUp() {
                marketReviewRepository.deleteAll();
                documentRepository.deleteAll();
                quizRepository.deleteAll();
                flashcardDeckRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed users
                user1 = userRepository.save(User.builder()
                                .email("student1@fpt.edu.vn")
                                .fullName("Student One")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                user2 = userRepository.save(User.builder()
                                .email("student2@fpt.edu.vn")
                                .fullName("Student Two")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build());

                // 2. Seed targets
                doc1 = documentRepository.save(Document.builder()
                                .user(user1)
                                .title("Software Architecture Document")
                                .build());

                quiz1 = quizRepository.save(Quiz.builder()
                                .creator(user1)
                                .title("Java OOP Quiz")
                                .build());

        }

        // ── 1. TEST POST /api/community/reviews (Tạo đánh giá) ────────────────────

        @Test
        void createReview_Success_ForDocument() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 5,
                                  "content": "Tài liệu này rất hay và bổ ích!"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/community/reviews")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.rating").value(5))
                                .andExpect(jsonPath("$.data.content").value("Tài liệu này rất hay và bổ ích!"))
                                .andExpect(jsonPath("$.data.reviewerName").value("Student One"))
                                .andExpect(jsonPath("$.data.reviewerId").value(user1.getId()));

                assertEquals(1L, marketReviewRepository.count());
        }

        @Test
        void createReview_Success_ForQuiz() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "QUIZ",
                                  "targetId": %d,
                                  "rating": 4,
                                  "content": "Quiz rất nhiều câu hỏi hay."
                                }
                                """.formatted(quiz1.getId());

                mockMvc.perform(post("/api/community/reviews")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user2)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.rating").value(4))
                                .andExpect(jsonPath("$.data.content").value("Quiz rất nhiều câu hỏi hay."))
                                .andExpect(jsonPath("$.data.reviewerName").value("Student Two"));
        }

        @Test
        void createReview_ValidationError_WhenRatingInvalid() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 6,
                                  "content": "Rating ngoài khoảng 1-5"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/community/reviews")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void createReview_NotFound_WhenDocumentNotExists() throws Exception {
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": 99999,
                                  "rating": 5,
                                  "content": "Tài liệu không tồn tại"
                                }
                                """;

                mockMvc.perform(post("/api/community/reviews")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_NOT_FOUND"));
        }

        @Test
        void createReview_Conflict_WhenDuplicateReview() throws Exception {
                // Tạo đánh giá thứ nhất
                marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(5)
                                .reviewNote("Lần 1")
                                .build());

                // Cố tình tạo đánh giá thứ hai cho cùng tài liệu
                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 4,
                                  "content": "Lần 2"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(post("/api/community/reviews")
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_REVIEW"));
        }

        // ── 2. TEST PUT /api/community/reviews/{id} (Cập nhật đánh giá) ───────────

        @Test
        void updateReview_Success_ByAuthor() throws Exception {
                MarketReview review = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(3)
                                .reviewNote("Hơi sơ sài.")
                                .build());

                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 5,
                                  "content": "Đã cập nhật đầy đủ, rất tuyệt vời!"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(put("/api/community/reviews/{id}", review.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.rating").value(5))
                                .andExpect(jsonPath("$.data.content").value("Đã cập nhật đầy đủ, rất tuyệt vời!"));

                MarketReview updated = marketReviewRepository.findById(review.getId()).orElseThrow();
                assertEquals(5, updated.getRating());
                assertEquals("Đã cập nhật đầy đủ, rất tuyệt vời!", updated.getReviewNote());
        }

        @Test
        void updateReview_Forbidden_ByNonAuthor() throws Exception {
                MarketReview review = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(3)
                                .reviewNote("Review của user 1")
                                .build());

                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 5,
                                  "content": "User 2 cố tình cập nhật"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(put("/api/community/reviews/{id}", review.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user2)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
        }

        @Test
        void updateReview_NotFound_WhenReviewIsMarketplaceApproval() throws Exception {
                // Tạo một review có voteResult != null (đây là review duyệt marketplace, không
                // phải community)
                MarketReview review = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(5)
                                .voteResult("APPROVED")
                                .reviewNote("Đã duyệt ok")
                                .build());

                String requestBody = """
                                {
                                  "targetType": "DOCUMENT",
                                  "targetId": %d,
                                  "rating": 3,
                                  "content": "Cố tình update qua API cộng đồng"
                                }
                                """.formatted(doc1.getId());

                mockMvc.perform(put("/api/community/reviews/{id}", review.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("REVIEW_NOT_FOUND"));
        }

        // ── 3. TEST DELETE /api/community/reviews/{id} (Xóa đánh giá) ─────────────

        @Test
        void deleteReview_Success_ByAuthor() throws Exception {
                MarketReview review = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(4)
                                .reviewNote("Cần xóa")
                                .build());

                mockMvc.perform(delete("/api/community/reviews/{id}", review.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user1))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.deleted").value(true));

                Optional<MarketReview> deleted = marketReviewRepository.findById(review.getId());
                assertFalse(deleted.isPresent());
        }

        @Test
        void deleteReview_Forbidden_ByNonAuthor() throws Exception {
                MarketReview review = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(4)
                                .build());

                mockMvc.perform(delete("/api/community/reviews/{id}", review.getId())
                                .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user2))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));

                assertTrue(marketReviewRepository.findById(review.getId()).isPresent());
        }

        // ── 4. TEST GET /api/community/reviews (Lấy danh sách đánh giá) ───────────

        @Test
        void getReviews_ReturnsOnlyCommunityReviews_SortedByNewest() throws Exception {
                // 1. Tạo 2 community reviews cho doc1
                MarketReview r1 = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(3)
                                .reviewNote("Đánh giá 1")
                                .build());

                MarketReview r2 = marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user2)
                                .document(doc1)
                                .rating(5)
                                .reviewNote("Đánh giá 2")
                                .build());

                // Sử dụng native query để update trực tiếp created_at trong DB, tránh việc
                // Hibernate @CreationTimestamp ghi đè lại cùng 1 thời điểm.
                entityManager.createNativeQuery("UPDATE market_reviews SET created_at = :createdAt WHERE id = :id")
                                .setParameter("createdAt", java.time.LocalDateTime.now().minusDays(1))
                                .setParameter("id", r1.getId())
                                .executeUpdate();

                entityManager.createNativeQuery("UPDATE market_reviews SET created_at = :createdAt WHERE id = :id")
                                .setParameter("createdAt", java.time.LocalDateTime.now())
                                .setParameter("id", r2.getId())
                                .executeUpdate();

                entityManager.flush();
                entityManager.clear();

                // 2. Tạo 1 marketplace approval review (có voteResult != null) -> phải bị loại
                // bỏ khi GET community reviews
                marketReviewRepository.save(MarketReview.builder()
                                .reviewer(user1)
                                .document(doc1)
                                .rating(5)
                                .voteResult("APPROVED")
                                .reviewNote("Duyệt hệ thống")
                                .build());

                // 3. GET danh sách đánh giá cộng đồng cho doc1
                mockMvc.perform(get("/api/community/reviews")
                                .param("targetType", "DOCUMENT")
                                .param("targetId", String.valueOf(doc1.getId()))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(2))
                                // Sắp xếp mới nhất trước: r2 được tạo sau r1 nên phải lên trước
                                .andExpect(jsonPath("$.data.items[0].id").value(r2.getId()))
                                .andExpect(jsonPath("$.data.items[0].content").value("Đánh giá 2"))
                                .andExpect(jsonPath("$.data.items[1].id").value(r1.getId()))
                                .andExpect(jsonPath("$.data.items[1].content").value("Đánh giá 1"))
                                .andExpect(jsonPath("$.data.totalElements").value(2));
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }
}
