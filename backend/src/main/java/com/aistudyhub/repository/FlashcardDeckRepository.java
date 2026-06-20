package com.aistudyhub.repository;

import com.aistudyhub.entity.FlashcardDeck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FlashcardDeckRepository
                extends JpaRepository<FlashcardDeck, Long>, JpaSpecificationExecutor<FlashcardDeck> {
}
