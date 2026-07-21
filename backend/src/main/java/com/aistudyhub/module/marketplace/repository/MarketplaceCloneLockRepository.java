package com.aistudyhub.module.marketplace.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Quiz;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MarketplaceCloneLockRepository {

    private final EntityManager entityManager;

    public Optional<Document> findDocumentByIdForUpdate(Long documentId) {
        return entityManager.createQuery(
                        "SELECT d FROM Document d WHERE d.id = :documentId", Document.class)
                .setParameter("documentId", documentId)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }

    public Optional<Quiz> findQuizByIdForUpdate(Long quizId) {
        return entityManager.createQuery(
                        "SELECT q FROM Quiz q WHERE q.id = :quizId", Quiz.class)
                .setParameter("quizId", quizId)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }
}
