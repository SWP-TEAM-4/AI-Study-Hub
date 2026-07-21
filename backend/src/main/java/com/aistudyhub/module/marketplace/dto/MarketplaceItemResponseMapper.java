package com.aistudyhub.module.marketplace.dto;

import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;

/**
 * Class Mapper dùng chung để ánh xạ các thực thể database (Document, Quiz,
 * FlashcardDeck)
 * sang MarketplaceItemResponse DTO thống nhất trước khi trả về cho client.
 * 
 * Quyết định thiết kế này nhất quán với các module khác trong dự án (như
 * DocumentResponseMapper).
 * 
 * Owner: BE3 (Task BE-028)
 */
public final class MarketplaceItemResponseMapper {

    // Khóa constructor để ngăn chặn việc khởi tạo class này bằng từ khóa new
    private MarketplaceItemResponseMapper() {
    }

    /**
     * Ánh xạ từ thực thể {@link Document} sang {@link MarketplaceItemResponse} DTO.
     *
     * @param doc Thực thể tài liệu học tập cần chuyển đổi
     * @return DTO MarketplaceItemResponse tương ứng, hoặc {@code null} nếu tham số
     *         đầu vào là null
     */
    public static MarketplaceItemResponse toResponse(Document doc) {
        if (doc == null) {
            return null;
        }
        return MarketplaceItemResponse.builder()
                .targetType("DOCUMENT")
                .targetId(doc.getId())
                .title(doc.getTitle())
                .subjectId(doc.getSubject() != null ? doc.getSubject().getId() : null)
                .creatorId(doc.getUser() != null ? doc.getUser().getId() : null)
                .creatorName(doc.getUser() != null ? doc.getUser().getFullName() : null)
                .downloadCount(doc.getDownloadCount())
                .reviewCount(doc.getReviewCount())
                .acceptPercentage(doc.getAcceptPercentage())
                .communityReviewCount(doc.getCommunityReviewCount())
                .communityRatingAvg(doc.getCommunityRatingAvg())
                .marketStatus(doc.getMarketStatus())
                .visibility(doc.getVisibility())
                .fileUrl(doc.getFileUrl())
                .fileType(doc.getFileType())
                .createdAt(doc.getCreatedAt())
                .clonedFromId(doc.getClonedFrom() != null ? doc.getClonedFrom().getId() : null)
                .build();
    }

    /**
     * Ánh xạ từ thực thể {@link Quiz} sang {@link MarketplaceItemResponse} DTO.
     *
     * @param quiz Thực thể đề thi/quiz cần chuyển đổi
     * @return DTO MarketplaceItemResponse tương ứng, hoặc {@code null} nếu tham số
     *         đầu vào là null
     */
    public static MarketplaceItemResponse toResponse(Quiz quiz) {
        if (quiz == null) {
            return null;
        }
        return MarketplaceItemResponse.builder()
                .targetType("QUIZ")
                .targetId(quiz.getId())
                .title(quiz.getTitle())
                .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
                .creatorId(quiz.getCreator() != null ? quiz.getCreator().getId() : null)
                .creatorName(quiz.getCreator() != null ? quiz.getCreator().getFullName() : null)
                .downloadCount(quiz.getDownloadCount())
                .reviewCount(quiz.getReviewCount())
                .acceptPercentage(quiz.getAcceptPercentage())
                .communityReviewCount(quiz.getCommunityReviewCount())
                .communityRatingAvg(quiz.getCommunityRatingAvg())
                .marketStatus(quiz.getMarketStatus())
                .visibility(quiz.getVisibility())
                .createdAt(quiz.getCreatedAt())
                .clonedFromId(quiz.getClonedFrom() != null ? quiz.getClonedFrom().getId() : null)
                .build();
    }

    /**
     * Ánh xạ từ thực thể {@link FlashcardDeck} sang {@link MarketplaceItemResponse}
     * DTO.
     *
     * @param deck Thực thể bộ thẻ ghi nhớ cần chuyển đổi
     * @return DTO MarketplaceItemResponse tương ứng, hoặc {@code null} nếu tham số
     *         đầu vào là null
     */
    public static MarketplaceItemResponse toResponse(FlashcardDeck deck) {
        if (deck == null) {
            return null;
        }
        return MarketplaceItemResponse.builder()
                .targetType("FLASHCARD_DECK")
                .targetId(deck.getId())
                .title(deck.getTitle())
                .subjectId(deck.getSubject() != null ? deck.getSubject().getId() : null)
                .creatorId(deck.getUser() != null ? deck.getUser().getId() : null)
                .creatorName(deck.getUser() != null ? deck.getUser().getFullName() : null)
                .downloadCount(deck.getDownloadCount())
                .reviewCount(deck.getReviewCount())
                .acceptPercentage(deck.getAcceptPercentage())
                .communityReviewCount(deck.getCommunityReviewCount())
                .communityRatingAvg(deck.getCommunityRatingAvg())
                .marketStatus(deck.getMarketStatus())
                .visibility(deck.getVisibility())
                .createdAt(deck.getCreatedAt())
                .clonedFromId(deck.getClonedFrom() != null ? deck.getClonedFrom().getId() : null)
                .build();
    }
}
