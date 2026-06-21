package com.aistudyhub.module.flashcard.service;

import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.FlashcardRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Flashcard;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckResponse;
import com.aistudyhub.module.flashcard.dto.FlashcardDeckSearchRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardRequest;
import com.aistudyhub.module.flashcard.dto.FlashcardResponse;
import com.aistudyhub.module.user.service.UserService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service xử lý toàn bộ logic nghiệp vụ liên quan đến Flashcard Decks (Bộ bài) và Flashcards (Thẻ nhớ).
 * <p>
 * Đảm bảo các ràng buộc bảo mật:
 * 1. Chỉ chủ sở hữu bộ bài (creator) mới được sửa/xóa Deck.
 * 2. Chỉ chủ sở hữu bộ bài mới được thêm/sửa/xóa các Card con thuộc Deck đó.
 * 3. Nếu bộ bài có trạng thái Visibility là PRIVATE, chỉ owner mới được xem chi tiết.
 * <p>
 * Owner: BE3 (Task BE-024)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardDeckRepository deckRepository;
    private final SubjectRepository subjectRepository;
    private final NotebookRepository notebookRepository;
    private final UserService userService;
    private final FlashcardRepository cardRepository;

    // =========================================================================
    // FLASHCARD DECK CRUD
    // =========================================================================

    /**
     * Tạo mới một bộ Flashcard Deck thuộc về người dùng hiện tại đang đăng nhập.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Nếu gán notebookId, notebook đó phải tồn tại và thuộc sở hữu của người dùng hiện tại.
     * - Nếu gán subjectId, môn học đó phải tồn tại trong hệ thống.
     * - Mặc định khi tạo mới, visibility = PRIVATE, marketStatus = NONE.
     * 
     * @param request chứa tiêu đề, notebookId, subjectId, và độ hiển thị (tùy chọn)
     * @return FlashcardDeckResponse chứa dữ liệu bộ bài vừa tạo
     * @throws AppException ném mã lỗi NOTEBOOK_NOT_FOUND nếu không tìm thấy notebook,
     *                      NOTEBOOK_ACCESS_DENIED nếu notebook thuộc về người khác,
     *                      SUBJECT_NOT_FOUND nếu môn học không tồn tại.
     */
    @Transactional
    public FlashcardDeckResponse createDeck(FlashcardDeckRequest request) {
        User currentUser = userService.getCurrentUser();

        Notebook notebook = null;
        if (request.getNotebookId() != null) {
            notebook = notebookRepository.findById(request.getNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));

            // Chỉ chủ sở hữu notebook mới được liên kết với deck
            if (!notebook.getUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        FlashcardDeck deck = FlashcardDeck.builder()
                .user(currentUser)
                .notebook(notebook)
                .subject(subject)
                .title(request.getTitle().trim())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build();

        deck = deckRepository.save(deck);
        log.info("Flashcard deck id={} created by userId={}", deck.getId(), currentUser.getId());

        return toDeckResponse(deck);
    }

    /**
     * Lấy thông tin chi tiết của bộ Flashcard Deck bao gồm cả danh sách các thẻ nhớ bên trong.
     * <p>
     * Phân quyền truy cập:
     * - Nếu bộ bài ở trạng thái PRIVATE, chỉ có chủ sở hữu mới có quyền xem chi tiết.
     * - Nếu bộ bài ở trạng thái PUBLIC_LINK hoặc MARKETPLACE, bất kỳ user đăng nhập nào cũng xem được.
     * 
     * @param id ID của bộ Flashcard Deck cần lấy chi tiết
     * @return FlashcardDeckResponse chứa thông tin bộ bài và danh sách thẻ nhớ
     * @throws AppException ném mã lỗi FLASHCARD_DECK_NOT_FOUND nếu không tìm thấy bộ bài,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu cố truy cập bộ bài private của người khác.
     */
    @Transactional(readOnly = true)
    public FlashcardDeckResponse getDeckById(Long id) {
        Long currentUserId = userService.getCurrentUserId();

        FlashcardDeck deck = deckRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        // Phân quyền: Nếu bộ bài là PRIVATE, chỉ chủ sở hữu mới có quyền xem
        if (deck.getVisibility() == Visibility.PRIVATE && !deck.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }
        
        return toDeckResponse(deck);
    }

    /**
     * Cập nhật thông tin cấu hình và metadata (title, notebook, subject, visibility) của bộ bài.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Chỉ chủ sở hữu (creator) bộ bài mới có quyền cập nhật.
     * - Nếu đổi sang notebook mới, notebook đó phải thuộc sở hữu của chính người dùng hiện tại.
     * 
     * @param id ID của bộ bài cần cập nhật
     * @param request chứa dữ liệu cập nhật mới
     * @return FlashcardDeckResponse thông tin bộ bài sau khi cập nhật thành công
     * @throws AppException ném mã lỗi FLASHCARD_DECK_NOT_FOUND nếu không tìm thấy bộ bài,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu không phải chủ sở hữu bộ bài hoặc notebook mới,
     *                      NOTEBOOK_NOT_FOUND nếu notebook mới không tồn tại,
     *                      SUBJECT_NOT_FOUND nếu môn học mới không tồn tại.
     */
    @Transactional
    public FlashcardDeckResponse updateDeck(Long id, FlashcardDeckRequest request) {
        Long currentUserId = userService.getCurrentUserId();

        FlashcardDeck deck = deckRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        
        // Validate quyền sở hữu bộ bài
        if (!deck.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }

        // Validate Notebook liên kết
        Notebook notebook = null;
        if (request.getNotebookId() != null) {
            notebook = notebookRepository.findById(request.getNotebookId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));

            // Chỉ được liên kết với Notebook do chính mình sở hữu
            if (!notebook.getUser().getId().equals(currentUserId)) {
                throw new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
            }
        }

        // Validate Subject liên kết
        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        // Cập nhật thông tin
        deck.setTitle(request.getTitle().trim());
        deck.setNotebook(notebook);
        deck.setSubject(subject);
        if (request.getVisibility() != null) {
            deck.setVisibility(request.getVisibility());
        }

        deck = deckRepository.save(deck);
        log.info("Flashcard deck id={} updated by userId={}", deck.getId(), currentUserId);
        return toDeckResponse(deck);
    }

    /**
     * Xóa hoàn toàn một bộ bài Flashcard Deck khỏi hệ thống.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Chỉ chủ sở hữu bộ bài mới có quyền thực hiện hành động này.
     * 
     * @param id ID của bộ bài cần xóa
     * @throws AppException ném mã lỗi FLASHCARD_DECK_NOT_FOUND nếu không tìm thấy bộ bài,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu user không phải chủ sở hữu bộ bài.
     */
    @Transactional
    public void deleteDeck(Long id) {
        Long currentUserId = userService.getCurrentUserId();

        FlashcardDeck deck = deckRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));

        // Validate ownership
        if (!deck.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }

        deckRepository.delete(deck);
        log.info("Flashcard deck id={} deleted by userId={}", id, currentUserId);
    }

    /**
     * Tìm kiếm và lọc danh sách Flashcard Decks do chính người dùng hiện tại sở hữu.
     * <p>
     * Sử dụng JPA Specification để xây dựng câu truy vấn động, hỗ trợ phân trang và sắp xếp.
     * 
     * @param searchRequest chứa từ khóa tìm kiếm (keyword) và các bộ lọc subjectId, visibility, marketStatus
     * @param pageable cấu hình phân trang (trang hiện tại, kích thước trang, sắp xếp)
     * @return Page của FlashcardDeckResponse chứa danh sách bộ bài khớp điều kiện
     */
    @Transactional(readOnly = true)
    public Page<FlashcardDeckResponse> searchMyDecks(FlashcardDeckSearchRequest searchRequest, Pageable pageable) {
        Long currentUserId = userService.getCurrentUserId();
        String keyword = searchRequest.getKeyword() != null ? searchRequest.getKeyword().trim() : null;

        Specification<FlashcardDeck> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Bắt buộc: chỉ lấy deck của chính user đang đăng nhập
            predicates.add(cb.equal(root.get("user").get("id"), currentUserId));

            // Tìm kiếm tương đối theo tiêu đề bộ bài
            if (keyword != null && !keyword.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
            }

            // Lọc theo subjectId
            if (searchRequest.getSubjectId() != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), searchRequest.getSubjectId()));
            }
            // Lọc theo visibility
            if (searchRequest.getVisibility() != null) {
                predicates.add(cb.equal(root.get("visibility"), searchRequest.getVisibility()));
            }
            // Lọc theo marketStatus
            if (searchRequest.getMarketStatus() != null) {
                predicates.add(cb.equal(root.get("marketStatus"), searchRequest.getMarketStatus()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return deckRepository.findAll(spec, pageable).map(this::toDeckResponse);
    }

    // =========================================================================
    // FLASHCARD CARD CRUD
    // =========================================================================

    /**
     * Thêm một chiếc thẻ nhớ (Card) mới vào bộ bài hiện có.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Chỉ chủ sở hữu của bộ bài mới có quyền thêm thẻ vào bộ đó.
     * 
     * @param deckId ID của bộ bài cần thêm thẻ
     * @param request chứa nội dung mặt trước (frontText) và mặt sau (backText)
     * @return FlashcardDeckResponse thông tin bộ bài bao gồm cả thẻ vừa được thêm
     * @throws AppException ném mã lỗi FLASHCARD_DECK_NOT_FOUND nếu không tìm thấy bộ bài,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu user không phải chủ sở hữu bộ bài.
     */
    @Transactional
    public FlashcardDeckResponse addCardToDeck(Long deckId, FlashcardRequest request) {
        Long currentUserId = userService.getCurrentUserId();

        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
        
        // Validate quyền sở hữu bộ bài
        if (!deck.getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }
        
        Flashcard card = Flashcard.builder()
                .deck(deck)
                .frontText(request.getFrontText().trim())
                .backText(request.getBackText().trim())
                .build();
        
        deck.getCards().add(card);
        deck = deckRepository.save(deck);
        log.info("Added new card id={} to deck id={}", card.getId(), deckId);

        return toDeckResponse(deck);
    }

    /**
     * Cập nhật thông tin nội dung (mặt trước, mặt sau) của một thẻ nhớ.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Chỉ chủ sở hữu của bộ bài chứa chiếc thẻ này mới có quyền sửa đổi thẻ.
     * 
     * @param cardId ID của thẻ nhớ cần cập nhật
     * @param request chứa dữ liệu cập nhật mới
     * @return FlashcardResponse chứa thông tin chi tiết của thẻ sau khi cập nhật
     * @throws AppException ném mã lỗi FLASHCARD_NOT_FOUND nếu không tìm thấy thẻ nhớ,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu user không sở hữu bộ bài chứa thẻ.
     */
    @Transactional
    public FlashcardResponse updateCard(Long cardId, FlashcardRequest request) {
        Long currentUserId = userService.getCurrentUserId();

        Flashcard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        
        // Validate quyền sở hữu thông qua bộ bài chứa chiếc thẻ
        if (!card.getDeck().getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }
        
        card.setFrontText(request.getFrontText().trim());
        card.setBackText(request.getBackText().trim());
        card = cardRepository.save(card);
        log.info("Card id={} updated by userId={}", cardId, currentUserId);

        return toCardResponse(card);
    }

    /**
     * Xóa một chiếc thẻ nhớ khỏi bộ bài.
     * <p>
     * Nghiệp vụ kiểm tra:
     * - Chỉ chủ sở hữu của bộ bài chứa chiếc thẻ này mới có quyền xóa thẻ.
     * 
     * @param cardId ID của thẻ nhớ cần xóa
     * @throws AppException ném mã lỗi FLASHCARD_NOT_FOUND nếu không tìm thấy thẻ nhớ,
     *                      FLASHCARD_DECK_ACCESS_DENIED nếu user không sở hữu bộ bài chứa thẻ.
     */
    @Transactional
    public void deleteCard(Long cardId) {
        Long currentUserId = userService.getCurrentUserId();

        Flashcard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_NOT_FOUND));
        
        // Validate quyền sở hữu
        if (!card.getDeck().getUser().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FLASHCARD_DECK_ACCESS_DENIED);
        }
        
        cardRepository.delete(card);
        log.info("Card id={} deleted by userId={}", cardId, currentUserId);
    }

    // =========================================================================
    // PRIVATE MAPPING METHODS
    // =========================================================================

    /**
     * Hàm helper chuyển đổi thực thể FlashcardDeck sang DTO FlashcardDeckResponse phẳng và an toàn.
     */
    private FlashcardDeckResponse toDeckResponse(FlashcardDeck deck) {
        List<FlashcardResponse> cardResponses = deck.getCards() == null ? new ArrayList<>()
                : deck.getCards().stream()
                        .map(this::toCardResponse)
                        .collect(Collectors.toList());
        return FlashcardDeckResponse.builder()
                .id(deck.getId())
                .userId(deck.getUser().getId())
                .notebookId(deck.getNotebook() != null ? deck.getNotebook().getId() : null)
                .subjectId(deck.getSubject() != null ? deck.getSubject().getId() : null)
                .title(deck.getTitle())
                .visibility(deck.getVisibility())
                .marketStatus(deck.getMarketStatus())
                .downloadCount(deck.getDownloadCount())
                .reviewCount(deck.getReviewCount())
                .acceptPercentage(deck.getAcceptPercentage())
                .createdAt(deck.getCreatedAt())
                .cards(cardResponses)
                .build();
    }

    /**
     * Hàm helper chuyển đổi thực thể Flashcard sang DTO FlashcardResponse phẳng và an toàn.
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
