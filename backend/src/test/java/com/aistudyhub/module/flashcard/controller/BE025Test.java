package com.aistudyhub.module.flashcard.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserFlashcardProgress;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.FlashcardRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserFlashcardProgressRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration Test dành cho Task BE-025: API Ôn tập Flashcard theo tiến độ.
 * Sử dụng H2 database ảo của profile "test".
 * Owner: BE3 (Task BE-025)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE025Test {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private NotebookRepository notebookRepository;

        @Autowired
        private FlashcardDeckRepository deckRepository;

        @Autowired
        private FlashcardRepository cardRepository;

        @Autowired
        private UserFlashcardProgressRepository progressRepository;

        private User studentA;
        private User studentB;
        private Subject subjectA;
        private Notebook notebookA;
        private Notebook notebookB;
        private FlashcardDeck deckPrivateA; // Bộ bài private của Student A
        private FlashcardDeck deckPrivateB; // Bộ bài private của Student B
        private FlashcardDeck deckPublicB; // Bộ bài public của Student B
        private Flashcard cardA1;
        private Flashcard cardA2;
        private Flashcard cardB1;
        private Flashcard cardPublic1;

        @BeforeEach
        void setUp() {
                // Xóa sạch dữ liệu trong DB ảo trước mỗi test case
                progressRepository.deleteAll();
                cardRepository.deleteAll();
                deckRepository.deleteAll();
                notebookRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Seed Users
                studentA = User.builder()
                                .email("studenta@aistudyhub.com")
                                .fullName("Student A")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build();
                studentA = userRepository.save(studentA);

                studentB = User.builder()
                                .email("studentb@aistudyhub.com")
                                .fullName("Student B")
                                .role(Role.STUDENT)
                                .isActive(true)
                                .build();
                studentB = userRepository.save(studentB);

                // 2. Seed Subject
                subjectA = Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build();
                subjectA = subjectRepository.save(subjectA);

                // 3. Seed Notebooks
                notebookA = Notebook.builder()
                                .user(studentA)
                                .subject(subjectA)
                                .title("Notebook SWR302 A")
                                .build();
                notebookA = notebookRepository.save(notebookA);

                notebookB = Notebook.builder()
                                .user(studentB)
                                .subject(subjectA)
                                .title("Notebook SWR302 B")
                                .build();
                notebookB = notebookRepository.save(notebookB);

                // 4. Seed Decks
                deckPrivateA = FlashcardDeck.builder()
                                .user(studentA)
                                .notebook(notebookA)
                                .subject(subjectA)
                                .title("Deck Private A")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build();
                deckPrivateA = deckRepository.save(deckPrivateA);

                deckPrivateB = FlashcardDeck.builder()
                                .user(studentB)
                                .notebook(notebookB)
                                .subject(subjectA)
                                .title("Deck Private B")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build();
                deckPrivateB = deckRepository.save(deckPrivateB);

                deckPublicB = FlashcardDeck.builder()
                                .user(studentB)
                                .notebook(notebookB)
                                .subject(subjectA)
                                .title("Deck Public B")
                                .visibility(Visibility.PUBLIC_LINK)
                                .marketStatus(MarketStatus.NONE)
                                .build();
                deckPublicB = deckRepository.save(deckPublicB);

                // 5. Seed Cards (Đồng bộ quan hệ hai chiều trong Java trước khi save)
                cardA1 = Flashcard.builder().deck(deckPrivateA).frontText("A1 Front").backText("A1 Back").build();
                deckPrivateA.getCards().add(cardA1);
                cardA1 = cardRepository.save(cardA1);

                cardA2 = Flashcard.builder().deck(deckPrivateA).frontText("A2 Front").backText("A2 Back").build();
                deckPrivateA.getCards().add(cardA2);
                cardA2 = cardRepository.save(cardA2);

                cardB1 = Flashcard.builder().deck(deckPrivateB).frontText("B1 Front").backText("B1 Back").build();
                deckPrivateB.getCards().add(cardB1);
                cardB1 = cardRepository.save(cardB1);

                cardPublic1 = Flashcard.builder().deck(deckPublicB).frontText("Public Front").backText("Public Back")
                                .build();
                deckPublicB.getCards().add(cardPublic1);
                cardPublic1 = cardRepository.save(cardPublic1);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // =========================================================================
        // 1. KIỂM THỬ API ĐÁNH GIÁ THẺ (POST /api/flashcards/{cardId}/review)
        // =========================================================================

        @Test
        void reviewCard_Success_Remembered() throws Exception {
                String requestJson = "{\"result\": \"REMEMBERED\"}";

                mockMvc.perform(post("/api/flashcards/" + cardA1.getId() + "/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Success"))
                                .andExpect(jsonPath("$.data.flashcardId").value(cardA1.getId()))
                                .andExpect(jsonPath("$.data.boxLevel").value(2)) // 1 -> 2
                                .andExpect(jsonPath("$.data.lastReviewed").exists())
                                .andExpect(jsonPath("$.data.nextReviewAt").exists());
        }

        @Test
        void reviewCard_Success_Forgot() throws Exception {
                // Tạo sẵn tiến độ ở hộp 4 cho cardA1
                UserFlashcardProgress progress = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA1)
                                .boxLevel(4)
                                .lastReviewed(LocalDateTime.now().minusDays(3))
                                .build();
                progressRepository.save(progress);

                String requestJson = "{\"result\": \"FORGOT\"}";

                mockMvc.perform(post("/api/flashcards/" + cardA1.getId() + "/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.boxLevel").value(1)); // 4 -> 1 (reset)
        }

        @Test
        void reviewCard_Success_PublicDeckOfOtherUser() throws Exception {
                // Student A được phép review thẻ thuộc deck PUBLIC_LINK của Student B
                String requestJson = "{\"result\": \"REMEMBERED\"}";

                mockMvc.perform(post("/api/flashcards/" + cardPublic1.getId() + "/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.boxLevel").value(2));
        }

        @Test
        void reviewCard_Forbidden_PrivateDeckOfOtherUser() throws Exception {
                // Student A KHÔNG được phép review thẻ thuộc deck PRIVATE của Student B
                String requestJson = "{\"result\": \"REMEMBERED\"}";

                mockMvc.perform(post("/api/flashcards/" + cardB1.getId() + "/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void reviewCard_NotFound_CardNotExist() throws Exception {
                String requestJson = "{\"result\": \"REMEMBERED\"}";

                mockMvc.perform(post("/api/flashcards/99999/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_NOT_FOUND"));
        }

        @Test
        void reviewCard_BadRequest_ValidationError() throws Exception {
                // Request body rỗng không có kết quả review
                String requestJson = "{}";

                mockMvc.perform(post("/api/flashcards/" + cardA1.getId() + "/review")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        // =========================================================================
        // 2. KIỂM THỬ API TIẾN ĐỘ BỘ BÀI (GET /api/flashcard-decks/{deckId}/progress)
        // =========================================================================

        @Test
        void getDeckProgress_Success() throws Exception {
                // Tạo tiến độ: cardA1 ở Hộp 2 (được coi là đã nhớ), cardA2 chưa ôn
                UserFlashcardProgress p1 = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA1)
                                .boxLevel(2)
                                .lastReviewed(LocalDateTime.now())
                                .build();
                progressRepository.save(p1);

                mockMvc.perform(get("/api/flashcard-decks/" + deckPrivateA.getId() + "/progress")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.deckId").value(deckPrivateA.getId()))
                                .andExpect(jsonPath("$.data.reviewedCards").value(1)) // 1 card đã ôn
                                .andExpect(jsonPath("$.data.totalCards").value(2)) // tổng 2 cards
                                .andExpect(jsonPath("$.data.rememberedRate").value(100.0)); // Hộp 2 >= 2 nên rate = 1/1
                                                                                            // * 100 = 100%
        }

        @Test
        void getDeckProgress_Success_NoCardsReviewed() throws Exception {
                // Deck có 2 thẻ nhưng chưa thẻ nào có tiến độ ôn tập
                mockMvc.perform(get("/api/flashcard-decks/" + deckPrivateA.getId() + "/progress")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.reviewedCards").value(0))
                                .andExpect(jsonPath("$.data.rememberedRate").value(0.0));
        }

        @Test
        void getDeckProgress_Forbidden_PrivateDeckOfOtherUser() throws Exception {
                // Student A không được phép xem tiến độ của Deck PRIVATE thuộc Student B
                mockMvc.perform(get("/api/flashcard-decks/" + deckPrivateB.getId() + "/progress")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void getDeckProgress_NotFound_DeckNotExist() throws Exception {
                mockMvc.perform(get("/api/flashcard-decks/99999/progress")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_NOT_FOUND"));
        }

        // =========================================================================
        // 3. KIỂM THỬ API LẤY THÊ ĐẾN HẠN (GET /api/flashcards/due)
        // =========================================================================

        @Test
        void getDueCards_Success() throws Exception {
                // Tạo sẵn 2 tiến độ:
                // 1. Thẻ cardA1 ở Hộp 2, đã ôn cách đây 3 ngày (vượt quá 2 ngày giãn cách của
                // Hộp 2) -> Phải đến hạn ôn.
                UserFlashcardProgress p1 = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA1)
                                .boxLevel(2)
                                .lastReviewed(LocalDateTime.now().minusDays(3))
                                .build();
                progressRepository.save(p1);

                // 2. Thẻ cardA2 ở Hộp 3, đã ôn cách đây 1 ngày (chưa vượt quá 4 ngày giãn cách
                // của Hộp 3) -> Chưa đến hạn ôn.
                UserFlashcardProgress p2 = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA2)
                                .boxLevel(3)
                                .lastReviewed(LocalDateTime.now().minusDays(1))
                                .build();
                progressRepository.save(p2);

                // Thẻ cardPublic1 chưa từng ôn bao giờ -> Phải đến hạn ôn.
                // Thẻ cardB1 thuộc private deck của Student B -> Không được phép xuất hiện.

                mockMvc.perform(get("/api/flashcards/due")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data").isArray())
                                // Kiểm tra xem danh sách có chứa đúng 2 thẻ: cardA1 (quá hạn) và cardPublic1
                                // (chưa ôn bao giờ)
                                .andExpect(jsonPath("$.data.length()").value(2))
                                // Kiểm tra sự xuất hiện của các thẻ đến hạn
                                .andExpect(jsonPath("$.data[?(@.id == " + cardA1.getId() + ")]").exists())
                                .andExpect(jsonPath("$.data[?(@.id == " + cardPublic1.getId() + ")]").exists());
        }

        @Test
        void getDueCards_Success_FilteredByDeckId() throws Exception {
                // Tạo sẵn 2 tiến độ:
                // 1. Thẻ cardA1 ở Hộp 2, đã ôn cách đây 3 ngày -> Phải đến hạn ôn.
                UserFlashcardProgress p1 = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA1)
                                .boxLevel(2)
                                .lastReviewed(LocalDateTime.now().minusDays(3))
                                .build();
                progressRepository.save(p1);

                // 2. Thẻ cardA2 ở Hộp 1, đã ôn hôm nay -> Chưa đến hạn ôn.
                UserFlashcardProgress p2 = UserFlashcardProgress.builder()
                                .user(studentA)
                                .flashcard(cardA2)
                                .boxLevel(1)
                                .lastReviewed(LocalDateTime.now())
                                .build();
                progressRepository.save(p2);

                // Lọc theo deckPrivateA (chỉ chứa cardA1 đến hạn, vì cardPublic1 ở deckPublicB bị lọc bỏ và cardA2 chưa đến hạn)
                mockMvc.perform(get("/api/flashcards/due")
                                .with(user(userDetails(studentA)))
                                .param("deckId", deckPrivateA.getId().toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.length()").value(1))
                                .andExpect(jsonPath("$.data[0].id").value(cardA1.getId()));
        }

        @Test
        void getDueCards_Forbidden_FilterByOtherUserPrivateDeck() throws Exception {
                // Lọc theo deckPrivateB của Student B -> Trả về lỗi 403
                mockMvc.perform(get("/api/flashcards/due")
                                .with(user(userDetails(studentA)))
                                .param("deckId", deckPrivateB.getId().toString()))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void getDueCards_NotFound_DeckNotExist() throws Exception {
                // Lọc theo deckId không tồn tại -> Trả về lỗi 404
                mockMvc.perform(get("/api/flashcards/due")
                                .with(user(userDetails(studentA)))
                                .param("deckId", "99999"))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_NOT_FOUND"));
        }
}
