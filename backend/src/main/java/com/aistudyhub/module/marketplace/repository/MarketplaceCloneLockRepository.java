package com.aistudyhub.module.marketplace.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

@Repository
public class MarketplaceCloneLockRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<Document> findDocumentByIdForUpdate(Long id) {
        return entityManager
                .createQuery("SELECT d FROM Document d WHERE d.id = :id", Document.class)
                .setParameter("id", id)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }

    public Optional<Quiz> findQuizByIdForUpdate(Long id) {
        return entityManager
                .createQuery("SELECT q FROM Quiz q WHERE q.id = :id", Quiz.class)
                .setParameter("id", id)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }

    public Optional<FlashcardDeck> findFlashcardDeckByIdForUpdate(Long id) {
        return entityManager
                .createQuery("SELECT f FROM FlashcardDeck f WHERE f.id = :id", FlashcardDeck.class)
                .setParameter("id", id)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }
}
