package com.aistudyhub.module.flashcard.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.FlashcardRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;

/**
 * Integration Test dành cho Task BE-024: API Quản lý Flashcard Deck và Card
 * CRUD.
 * Kiểm tra đầy đủ các kịch bản thành công và các lỗi nghiệp vụ phân quyền,
 * không tìm thấy, validation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class BE024Test {

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

        private User studentA;
        private User studentB;
        private Subject subjectA;
        private Notebook notebookA;
        private Notebook notebookB;
        private FlashcardDeck deckA; // Private deck owned by Student A
        private FlashcardDeck deckB; // Private deck owned by Student B
        private FlashcardDeck deckPublic; // Public deck owned by Student B
        private Flashcard cardA1;

        @BeforeEach
        void setUp() {
                // Xóa sạch dữ liệu theo thứ tự quan hệ khóa ngoại
                cardRepository.deleteAll();
                deckRepository.deleteAll();
                notebookRepository.deleteAll();
                subjectRepository.deleteAll();
                userRepository.deleteAll();

                // 1. Tạo Users
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

                // 2. Tạo Subject
                subjectA = Subject.builder()
                                .code("SWR302")
                                .name("Software Requirements")
                                .build();
                subjectA = subjectRepository.save(subjectA);

                // 3. Tạo Notebooks
                notebookA = Notebook.builder()
                                .user(studentA)
                                .subject(subjectA)
                                .title("Sổ tay SWR302 của Student A")
                                .build();
                notebookA = notebookRepository.save(notebookA);

                notebookB = Notebook.builder()
                                .user(studentB)
                                .subject(subjectA)
                                .title("Sổ tay SWR302 của Student B")
                                .build();
                notebookB = notebookRepository.save(notebookB);

                // 4. Tạo Decks
                deckA = FlashcardDeck.builder()
                                .user(studentA)
                                .notebook(notebookA)
                                .subject(subjectA)
                                .title("SWR302 Terms Part 1")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .downloadCount(0)
                                .reviewCount(0)
                                .acceptPercentage(BigDecimal.ZERO)
                                .build();
                deckA = deckRepository.save(deckA);

                deckB = FlashcardDeck.builder()
                                .user(studentB)
                                .notebook(notebookB)
                                .subject(subjectA)
                                .title("SWR302 Terms Part 2")
                                .visibility(Visibility.PRIVATE)
                                .marketStatus(MarketStatus.NONE)
                                .build();
                deckB = deckRepository.save(deckB);

                deckPublic = FlashcardDeck.builder()
                                .user(studentB)
                                .notebook(notebookB)
                                .subject(subjectA)
                                .title("Public SWR302 Core Concepts")
                                .visibility(Visibility.PUBLIC_LINK)
                                .marketStatus(MarketStatus.NONE)
                                .build();
                deckPublic = deckRepository.save(deckPublic);

                // 5. Tạo Cards
                cardA1 = Flashcard.builder()
                                .deck(deckA)
                                .frontText("SRS")
                                .backText("Software Requirements Specification")
                                .build();
                deckA.getCards().add(cardA1); // Đồng bộ quan hệ hai chiều trong bộ nhớ
                cardA1 = cardRepository.save(cardA1);
        }

        private CustomUserDetails userDetails(User user) {
                return new CustomUserDetails(user);
        }

        // =========================================================================
        // 1. KIỂM THỬ DECK CRUD THÀNH CÔNG (SUCCESS CASES)
        // =========================================================================

        @Test
        void createDeck_Success() throws Exception {
                String requestJson = String.format(
                                "{\"title\": \"Chemistry Basic\", \"notebookId\": %d, \"subjectId\": %d, \"visibility\": \"PRIVATE\"}",
                                notebookA.getId(), subjectA.getId());

                mockMvc.perform(post("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Success"))
                                .andExpect(jsonPath("$.data.title").value("Chemistry Basic"))
                                .andExpect(jsonPath("$.data.userId").value(studentA.getId()))
                                .andExpect(jsonPath("$.data.notebookId").value(notebookA.getId()))
                                .andExpect(jsonPath("$.data.subjectId").value(subjectA.getId()))
                                .andExpect(jsonPath("$.data.visibility").value("PRIVATE"));
        }

        @Test
        void getDeckById_Success_OwnerAccessPrivate() throws Exception {
                mockMvc.perform(get("/api/flashcard-decks/" + deckA.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.title").value("SWR302 Terms Part 1"))
                                .andExpect(jsonPath("$.data.cards[0].frontText").value("SRS"));
        }

        @Test
        void getDeckById_Success_NonOwnerAccessPublic() throws Exception {
                // Student A được phép xem Deck PUBLIC_LINK của Student B
                mockMvc.perform(get("/api/flashcard-decks/" + deckPublic.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.title").value("Public SWR302 Core Concepts"));
        }

        @Test
        void updateDeck_Success() throws Exception {
                String requestJson = String.format(
                                "{\"title\": \"SWR302 Updated Title\", \"notebookId\": %d, \"subjectId\": %d, \"visibility\": \"PUBLIC_LINK\"}",
                                notebookA.getId(), subjectA.getId());

                mockMvc.perform(put("/api/flashcard-decks/" + deckA.getId())
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.title").value("SWR302 Updated Title"))
                                .andExpect(jsonPath("$.data.visibility").value("PUBLIC_LINK"));
        }

        @Test
        void deleteDeck_Success() throws Exception {
                mockMvc.perform(delete("/api/flashcard-decks/" + deckA.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Deleted successfully"))
                                .andExpect(jsonPath("$.data.deleted").value(true));
        }

        @Test
        void searchMyDecks_Success() throws Exception {
                // Tìm kiếm không lọc
                mockMvc.perform(get("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.items.length()").value(1))
                                .andExpect(jsonPath("$.data.items[0].title").value("SWR302 Terms Part 1"));

                // Tìm kiếm lọc theo keyword & subjectId
                mockMvc.perform(get("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .param("keyword", "Part 1")
                                .param("subjectId", subjectA.getId().toString())
                                .param("visibility", "PRIVATE")
                                .param("marketStatus", "NONE"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.items.length()").value(1));
        }

        // =========================================================================
        // 2. KIỂM THỬ CARD CRUD THÀNH CÔNG (SUCCESS CASES)
        // =========================================================================

        @Test
        void addCardToDeck_Success() throws Exception {
                String requestJson = "{\"frontText\": \"FRD\", \"backText\": \"Formal Requirements Document\"}";

                mockMvc.perform(post("/api/flashcard-decks/" + deckA.getId() + "/cards")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.cards.length()").value(2))
                                .andExpect(jsonPath("$.data.cards[1].frontText").value("FRD"));
        }

        @Test
        void updateCard_Success() throws Exception {
                String requestJson = "{\"frontText\": \"SRS Updated\", \"backText\": \"Software Requirements Specification Updated\"}";

                mockMvc.perform(put("/api/flashcards/" + cardA1.getId())
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.frontText").value("SRS Updated"))
                                .andExpect(jsonPath("$.data.backText")
                                                .value("Software Requirements Specification Updated"));
        }

        @Test
        void deleteCard_Success() throws Exception {
                mockMvc.perform(delete("/api/flashcards/" + cardA1.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Deleted successfully"))
                                .andExpect(jsonPath("$.data.deleted").value(true));
        }

        // =========================================================================
        // 3. KIỂM THỬ LỖI NGHIỆP VỤ & PHÂN QUYỀN (ERROR SCENARIOS)
        // =========================================================================

        @Test
        void createDeck_NotebookNotFound() throws Exception {
                String requestJson = "{\"title\": \"Chemistry Basic\", \"notebookId\": 999999, \"visibility\": \"PRIVATE\"}";

                mockMvc.perform(post("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_NOT_FOUND"));
        }

        @Test
        void createDeck_NotebookAccessDenied() throws Exception {
                // Student A cố gắng liên kết với NotebookB (của Student B)
                String requestJson = String.format(
                                "{\"title\": \"Chemistry Basic\", \"notebookId\": %d, \"visibility\": \"PRIVATE\"}",
                                notebookB.getId());

                mockMvc.perform(post("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_ACCESS_DENIED"));
        }

        @Test
        void createDeck_SubjectNotFound() throws Exception {
                String requestJson = "{\"title\": \"Chemistry Basic\", \"subjectId\": 999999, \"visibility\": \"PRIVATE\"}";

                mockMvc.perform(post("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("SUBJECT_NOT_FOUND"));
        }

        @Test
        void getDeckById_NotFound() throws Exception {
                mockMvc.perform(get("/api/flashcard-decks/999999")
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_NOT_FOUND"));
        }

        @Test
        void getDeckById_AccessDenied_Private() throws Exception {
                // Student A truy cập Deck PRIVATE của Student B
                mockMvc.perform(get("/api/flashcard-decks/" + deckB.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void updateDeck_AccessDenied() throws Exception {
                // Student A sửa Deck của Student B
                String requestJson = "{\"title\": \"Hacked Deck Title\"}";

                mockMvc.perform(put("/api/flashcard-decks/" + deckB.getId())
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void updateDeck_NotebookAccessDenied() throws Exception {
                // Student A sửa Deck của chính mình nhưng gán notebookB của Student B
                String requestJson = String.format(
                                "{\"title\": \"SWR302 Updated Title\", \"notebookId\": %d}",
                                notebookB.getId());

                mockMvc.perform(put("/api/flashcard-decks/" + deckA.getId())
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("NOTEBOOK_ACCESS_DENIED"));
        }

        @Test
        void deleteDeck_AccessDenied() throws Exception {
                // Student A xóa Deck của Student B
                mockMvc.perform(delete("/api/flashcard-decks/" + deckB.getId())
                                .with(user(userDetails(studentA))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void searchMyDecks_InvalidEnums() throws Exception {
                // Gửi query param enum sai
                mockMvc.perform(get("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .param("visibility", "INVALID_VISIBILITY"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

                mockMvc.perform(get("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .param("marketStatus", "INVALID_STATUS"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }

        @Test
        void addCardToDeck_AccessDenied() throws Exception {
                // Student A thêm Card vào Deck của Student B
                String requestJson = "{\"frontText\": \"FRD\", \"backText\": \"Formal Requirements Document\"}";

                mockMvc.perform(post("/api/flashcard-decks/" + deckB.getId() + "/cards")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void updateCard_NotFound() throws Exception {
                String requestJson = "{\"frontText\": \"FRD\", \"backText\": \"Formal Requirements Document\"}";

                mockMvc.perform(put("/api/flashcards/999999")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_NOT_FOUND"));
        }

        @Test
        void updateCard_AccessDenied() throws Exception {
                // Student B cố gắng cập nhật Card của Student A
                String requestJson = "{\"frontText\": \"FRD\", \"backText\": \"Formal Requirements Document\"}";

                mockMvc.perform(put("/api/flashcards/" + cardA1.getId())
                                .with(user(userDetails(studentB)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void deleteCard_AccessDenied() throws Exception {
                // Student B cố gắng xóa Card của Student A
                mockMvc.perform(delete("/api/flashcards/" + cardA1.getId())
                                .with(user(userDetails(studentB))))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("FLASHCARD_DECK_ACCESS_DENIED"));
        }

        @Test
        void createDeck_ValidationError() throws Exception {
                // Thiếu trường title bắt buộc
                String requestJson = "{\"notebookId\": 1, \"visibility\": \"PRIVATE\"}";

                mockMvc.perform(post("/api/flashcard-decks")
                                .with(user(userDetails(studentA)))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
        }
}
