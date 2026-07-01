package com.aistudyhub.module.admin.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.FlashcardDeck;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.module.admin.dto.AdminContentResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.FlashcardDeckRepository;
import com.aistudyhub.repository.QuizRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminContentServiceImpl implements AdminContentService {
        private final DocumentRepository documentRepository;
        private final QuizRepository quizRepository;
        private final FlashcardDeckRepository flashcardDeckRepository;

        @Override
        @Transactional(readOnly = true)
        public List<AdminContentResponse> getContents(Long ownerId, Long subjectId, Visibility visibility,
                        MarketStatus marketStatus) {
                List<AdminContentResponse> documents = documentRepository.findAll()
                                .stream()
                                .filter(d -> ownerId == null
                                                || d.getUser().getId().equals(ownerId))
                                .filter(d -> subjectId == null
                                                || (d.getSubject() != null
                                                                && d.getSubject().getId().equals(subjectId)))
                                .filter(d -> visibility == null
                                                || d.getVisibility() == visibility)
                                .filter(d -> marketStatus == null
                                                || d.getMarketStatus() == marketStatus)
                                .map(this::mapToResponse)
                                .toList();
                List<AdminContentResponse> quizzes = quizRepository.findAll().stream()
                                .filter(q -> matches(q.getCreator().getId(), q.getSubject() != null ? q.getSubject().getId() : null,
                                                q.getVisibility(), q.getMarketStatus(), ownerId, subjectId, visibility, marketStatus))
                                .map(this::mapToResponse).toList();
                List<AdminContentResponse> decks = flashcardDeckRepository.findAll().stream()
                                .filter(d -> matches(d.getUser().getId(), d.getSubject() != null ? d.getSubject().getId() : null,
                                                d.getVisibility(), d.getMarketStatus(), ownerId, subjectId, visibility, marketStatus))
                                .map(this::mapToResponse).toList();
                return java.util.stream.Stream.of(documents, quizzes, decks)
                                .flatMap(List::stream)
                                .sorted(java.util.Comparator.comparing(AdminContentResponse::getCreatedAt,
                                                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                                .toList();
        }

        @Override
        public AdminContentResponse getContent(String targetType, Long targetId) {
                return switch (normalizeType(targetType)) {
                        case "DOCUMENT" -> mapToResponse(documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND)));
                        case "QUIZ" -> mapToResponse(quizRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND)));
                        case "FLASHCARD_DECK" -> mapToResponse(flashcardDeckRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND)));
                        default -> throw unsupportedType();
                };
        }

        @Override
        public AdminContentResponse updateVisibility(String targetType, Long targetId, Visibility visibility) {
                return switch (normalizeType(targetType)) {
                        case "DOCUMENT" -> { Document item = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                                item.setVisibility(visibility); yield mapToResponse(documentRepository.save(item)); }
                        case "QUIZ" -> { Quiz item = quizRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                                item.setVisibility(visibility); yield mapToResponse(quizRepository.save(item)); }
                        case "FLASHCARD_DECK" -> { FlashcardDeck item = flashcardDeckRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                                item.setVisibility(visibility); yield mapToResponse(flashcardDeckRepository.save(item)); }
                        default -> throw unsupportedType();
                };
        }

        @Override
        public void updateMarketStatus(String targetType, Long targetId, MarketStatus marketStatus) {
                switch (normalizeType(targetType)) {
                        case "DOCUMENT" -> { Document item = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                                item.setMarketStatus(marketStatus); documentRepository.save(item); }
                        case "QUIZ" -> { Quiz item = quizRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                                item.setMarketStatus(marketStatus); quizRepository.save(item); }
                        case "FLASHCARD_DECK" -> { FlashcardDeck item = flashcardDeckRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                                item.setMarketStatus(marketStatus); flashcardDeckRepository.save(item); }
                        default -> throw unsupportedType();
                }
        }

        @Override
        public void deleteContent(String targetType, Long targetId) {
                switch (normalizeType(targetType)) {
                        case "DOCUMENT" -> { Document item = documentRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                                item.setVisibility(Visibility.PRIVATE); item.setMarketStatus(MarketStatus.REJECTED);
                                documentRepository.save(item); }
                        case "QUIZ" -> { Quiz item = quizRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                                item.setVisibility(Visibility.PRIVATE); item.setMarketStatus(MarketStatus.REJECTED);
                                quizRepository.save(item); }
                        case "FLASHCARD_DECK" -> { FlashcardDeck item = flashcardDeckRepository.findById(targetId)
                                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                                item.setVisibility(Visibility.PRIVATE); item.setMarketStatus(MarketStatus.REJECTED);
                                flashcardDeckRepository.save(item); }
                        default -> throw unsupportedType();
                }
        }

        private AdminContentResponse mapToResponse(
                        Document document) {

                return AdminContentResponse.builder()
                                .id(document.getId())
                                .targetType("DOCUMENT")
                                .title(document.getTitle())
                                .ownerId(document.getUser().getId())
                                .ownerName(document.getUser().getFullName())
                                .subjectId(
                                                document.getSubject() != null
                                                                ? document.getSubject().getId()
                                                                : null)
                                .subjectName(
                                                document.getSubject() != null
                                                                ? document.getSubject().getName()
                                                                : null)
                                .visibility(document.getVisibility())
                                .marketStatus(document.getMarketStatus())
                                .createdAt(document.getCreatedAt())
                                .build();
        }

        private AdminContentResponse mapToResponse(Quiz item) {
                return response(item.getId(), "QUIZ", item.getTitle(), item.getCreator().getId(),
                                item.getCreator().getFullName(), item.getSubject(), item.getVisibility(),
                                item.getMarketStatus(), item.getCreatedAt());
        }

        private AdminContentResponse mapToResponse(FlashcardDeck item) {
                return response(item.getId(), "FLASHCARD_DECK", item.getTitle(), item.getUser().getId(),
                                item.getUser().getFullName(), item.getSubject(), item.getVisibility(),
                                item.getMarketStatus(), item.getCreatedAt());
        }

        private AdminContentResponse response(Long id, String type, String title, Long ownerId, String ownerName,
                        com.aistudyhub.entity.Subject subject, Visibility visibility, MarketStatus status,
                        java.time.LocalDateTime createdAt) {
                return AdminContentResponse.builder().id(id).targetType(type).title(title).ownerId(ownerId)
                                .ownerName(ownerName).subjectId(subject != null ? subject.getId() : null)
                                .subjectName(subject != null ? subject.getName() : null).visibility(visibility)
                                .marketStatus(status).createdAt(createdAt).build();
        }

        private boolean matches(Long actualOwnerId, Long actualSubjectId, Visibility actualVisibility,
                        MarketStatus actualStatus, Long ownerId, Long subjectId, Visibility visibility,
                        MarketStatus marketStatus) {
                return (ownerId == null || ownerId.equals(actualOwnerId))
                                && (subjectId == null || subjectId.equals(actualSubjectId))
                                && (visibility == null || visibility == actualVisibility)
                                && (marketStatus == null || marketStatus == actualStatus);
        }

        private String normalizeType(String targetType) {
                return targetType == null ? "" : targetType.trim().toUpperCase();
        }

        private AppException unsupportedType() {
                return new AppException(ErrorCode.VALIDATION_ERROR,
                                "targetType must be DOCUMENT, QUIZ, or FLASHCARD_DECK");
        }
}
