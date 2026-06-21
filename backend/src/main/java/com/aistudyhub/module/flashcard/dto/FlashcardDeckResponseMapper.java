package com.aistudyhub.module.flashcard.dto;

import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Flashcard;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Class utility chuyên thực hiện ánh xạ từ FlashcardDeck sang DTO.
 */
public final class FlashcardDeckResponseMapper {

    private FlashcardDeckResponseMapper() {
    }

    public static FlashcardDeckResponse toResponse(FlashcardDeck deck) {
        List<FlashcardResponse> cardResponses = deck.getCards() == null ? new ArrayList<>()
                : deck.getCards().stream()
                        .map(FlashcardDeckResponseMapper::toCardResponse)
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

    private static FlashcardResponse toCardResponse(Flashcard card) {
        return FlashcardResponse.builder()
                .id(card.getId())
                .deckId(card.getDeck().getId())
                .frontText(card.getFrontText())
                .backText(card.getBackText())
                .build();
    }
}