package com.aistudyhub.module.flashcard.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.FlashcardReviewResult;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserFlashcardProgress;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckProgressResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardReviewRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardReviewResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.FlashcardRepository;
import com.aistudyhub.repository.UserFlashcardProgressRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý logic nghiệp vụ liên quan đến tiến độ ôn tập Flashcard (Spaced
 * Repetition).
 * Owner: BE3 (Task BE-025)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardProgressService {
    private final UserFlashcardProgressRepository progressRepository;
    private final FlashcardRepository cardRepository;
    private final UserService userService;
    private final FlashcardDeckRepository deckRepository;

    /***
     * Ghi nhận và cập nhật tiến độ ôn tập của một thẻ flashcard
     * 
     * 
     */
    @Transactional
    public FlashcardReviewResponse reviewCard(Long cardId, FlashcardReviewRequest request) {

        // 1.Lấy thông tin User hiện tại
        User currentUser = userService.getCurrentUser();

        // 2.Tìm kiếm Flashcard cần ôn tập
        Flashcard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));

        FlashcardDeck deck = card.getDeck();

        // 3. Kiểm tra phân quyền: Nếu bộ bài là PRIVATE, chỉ chủ sơr hữu bộ bài mới
        // được ôn tập
        if (deck.getVisibility() == Visibility.PRIVATE
                && !deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }

        // 4. Lấy tiến độ cũ của User vowis Card này, hoặc tạo mới nếu chưa từng học

        UserFlashcardProgress progress = progressRepository
                .findByUserIdAndFlashcardId(currentUser.getId(), cardId)
                .orElseGet(() -> UserFlashcardProgress.builder()
                        .user(currentUser)
                        .flashcard(card)
                        .boxLevel(1)
                        .build());

        // 5.Ấp dụng thuật toán Spaced Repetition (Hộp Leiner)
        int currentBox = progress.getBoxLevel();
        if (request.getResult() == FlashcardReviewResult.REMEMBERED) {
            // Nhớ bài -> tăng boxlevel lên 1 cấp, tối đa là 5
            progress.setBoxLevel(Math.min(currentBox + 1, 5));
        } else {
            // Quên bài -> reset boxlevel về 1
            progress.setBoxLevel(1);
        }

        // 6. Cập nhật thời điểm vừa ôn tập
        LocalDateTime now = LocalDateTime.now();
        progress.setLastReviewed(now);

        // Lưu vào cơ sở dữ liệu
        progress = progressRepository.save(progress);
        log.info("User id={} reviewed card id={}, boxleved update:{}->{}", currentUser.getId(), cardId, currentBox,
                progress.getBoxLevel());

        // 7.Tính thời điểm ôn tập tiếp theo để trả về client
        int intervalDays = getReviewIntervalDays(progress.getBoxLevel());
        LocalDateTime nextReviewAt = now.plusDays(intervalDays);

        return FlashcardReviewResponse.builder()
                .flashcardId(cardId)
                .boxLevel(progress.getBoxLevel())
                .lastReviewed(progress.getLastReviewed())
                .nextReviewAt(nextReviewAt)
                .build();

    }

    /**
     * Hàm phụ trợ lấy khoảng cách ngày ôn tập tiếp theo dựa trên Box Level.
     */
    private int getReviewIntervalDays(int boxLevel) {
        return switch (boxLevel) {
            case 1 -> 1;
            case 2 -> 2;
            case 3 -> 4;
            case 4 -> 7;
            case 5 -> 14;
            default -> 1;
        };
    }

    /**
     * Lấy thống kê tiến độ ôn tập của một bộ bài flashcard đối với người dùng hiện
     * tại.
     * 
     * @param deckId ID của bộ bài cần thống kê
     * @return FlashcardDeckProgressResponse chứa thông tin tiến độ
     */
    @Transactional(readOnly = true)
    public FlashcardDeckProgressResponse getDeckProgress(Long deckId) {
        // 1.Lấy thông tin User hiện tại
        User currentUser = userService.getCurrentUser();

        // 2.Timf bộ bài flashcard
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        // 3.Kiểm tra phân quyền: nếu bộ bài là PRIVATE, chỉ chủ sở hữu mới được phép
        // xem tiến độ
        if (deck.getVisibility() == Visibility.PRIVATE && !deck.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);

        }

        // 4.Đếm tổng số thẻ trong bộ bài
        int totalCards = deck.getCards().size();

        // 5.Lấy danh sách tất cả các tiến độ ôn tập của user hiện tại cho bộ bài này
        List<UserFlashcardProgress> progresses = progressRepository.findByUserIdAndFlashcardDeckId(currentUser.getId(),
                deckId);

        // 6. Số lượng thẻ đã ôn tập (đã có bản ghi progress)
        int reviewCards = progresses.size();

        // 7. Tính tỉ lệ ghi nhớ(các thẻ có boxlevel >=2)
        double rememberedRate = 0.0;
        if (reviewCards > 0) {
            long rememberCount = progresses.stream().filter(p -> p.getBoxLevel() >= 2).count();
            rememberedRate = ((double) rememberCount / reviewCards) * 100.0;
        }

        // 8. Trả về DTO response
        return FlashcardDeckProgressResponse.builder()
                .deckId(deckId)
                .reviewedCards(reviewCards)
                .totalCards(totalCards)
                .rememberedRate(rememberedRate)
                .build();
    }

    /**
     * Lấy danh sách các thẻ nhớ đến hạn cần ôn tập của người dùng hiện tại (có thể lọc theo bộ bài).
     * 
     * @param deckId ID của bộ bài flashcard cần lọc (tùy chọn)
     * @return Danh sách các FlashcardResponse đến hạn
     */
    @Transactional(readOnly = true)
    public List<FlashcardResponse> getDueCards(Long deckId) {
        // 1. Lấy thông tin User hiện tại
        User currentUser = userService.getCurrentUser();

        // 2. Nếu người dùng chỉ định deckId, kiểm tra quyền truy cập đối với bộ bài đó
        if (deckId != null) {
            FlashcardDeck deck = deckRepository.findById(deckId)
                    .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
            if (deck.getVisibility() == Visibility.PRIVATE && !deck.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
            }
        }

        // 3. Tính toán các mốc thời gian tối hạn (cutoff times) cho từng Box Level
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff1 = now.minusDays(1);
        LocalDateTime cutoff2 = now.minusDays(2);
        LocalDateTime cutoff3 = now.minusDays(4);
        LocalDateTime cutoff4 = now.minusDays(7);
        LocalDateTime cutoff5 = now.minusDays(14);

        // 4. Định nghĩa các trạng thái hiển thị công khai được phép ôn tập
        List<Visibility> publicVisibilities = List.of(Visibility.PUBLIC_LINK, Visibility.MARKETPLACE);

        // 5. Lấy danh sách thực thể Flashcard đến hạn từ database
        List<Flashcard> dueCards = cardRepository.findDueCards(
                currentUser.getId(),
                publicVisibilities,
                deckId,
                cutoff1,
                cutoff2,
                cutoff3,
                cutoff4,
                cutoff5);

        // 6. Chuyển đổi danh sách Entity sang DTO và trả về
        return dueCards.stream()
                .map(this::toCardResponse)
                .toList();
    }

    /**
     * Hàm phụ trợ chuyển đổi Flashcard Entity sang FlashcardResponse DTO.
     */
    private FlashcardResponse toCardResponse(Flashcard card) {
        return FlashcardResponse.builder()
                .id(card.getId())
                .deckId(card.getDeck().getId())
                .frontText(card.getFrontText())
                .backText(card.getBackText())
                .build();
    }

}
