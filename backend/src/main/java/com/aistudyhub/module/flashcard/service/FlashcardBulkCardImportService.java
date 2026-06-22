package com.aistudyhub.module.flashcard.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.module.chat.dto.practice.FlashcardGeneratedCard;
import com.aistudyhub.module.flashcard.dto.FlashcardRequest;
import com.aistudyhub.repository.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FlashcardBulkCardImportService {

    private final FlashcardService flashcardService;
    private final FlashcardRepository flashcardRepository;

    @Transactional
    public ImportResult importCards(FlashcardDeck deck, List<FlashcardGeneratedCard> generatedCards,
                                    boolean skipDuplicates) {
        Set<String> existingCards = flashcardRepository.findByDeckIdOrderById(deck.getId()).stream()
                .map(card -> normalize(card.getFrontText()))
                .collect(HashSet::new, HashSet::add, HashSet::addAll);

        Set<String> seenInPayload = new HashSet<>();
        int createdCards = 0;
        int skippedDuplicates = 0;

        for (FlashcardGeneratedCard generatedCard : generatedCards) {
            String normalizedFrontText = normalize(generatedCard.getFrontText());
            boolean duplicated = existingCards.contains(normalizedFrontText) || !seenInPayload.add(normalizedFrontText);
            if (duplicated) {
                if (skipDuplicates) {
                    skippedDuplicates++;
                    continue;
                }
                throw new AppException(ErrorCode.PRACTICE_IMPORT_DUPLICATE_ITEM,
                        "Duplicate flashcard detected: " + generatedCard.getFrontText());
            }

            FlashcardRequest cardRequest = new FlashcardRequest();
            cardRequest.setFrontText(generatedCard.getFrontText());
            cardRequest.setBackText(generatedCard.getBackText());
            flashcardService.addCardToDeck(deck.getId(), cardRequest);
            existingCards.add(normalizedFrontText);
            createdCards++;
        }

        return new ImportResult(createdCards, skippedDuplicates);
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    public record ImportResult(int createdCards, int skippedDuplicates) {
    }
}
