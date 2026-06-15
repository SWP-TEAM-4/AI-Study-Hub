package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.module.document.dto.NotebookDocumentDeleteResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotebookDocumentService {

    private final NotebookRepository notebookRepository;
    private final DocumentRepository documentRepository;
    private final NotebookDocumentRepository notebookDocumentRepository;

    @Transactional(readOnly = true)
    public PaginationResponse<DocumentResponse> listNotebookDocuments(
            Long notebookId,
            Long userId,
            int page,
            int size,
            String keyword,
            String sort,
            Long subjectId) {

        validatePaging(page, size);
        resolveOwnedNotebook(notebookId, userId);

        List<DocumentResponse> filteredDocuments = notebookDocumentRepository.findByNotebookId(notebookId).stream()
                .map(NotebookDocument::getDocument)
                .filter(document -> matchesKeyword(document, keyword))
                .filter(document -> subjectId == null || (document.getSubject() != null && subjectId.equals(document.getSubject().getId())))
                .sorted(resolveComparator(sort))
                .map(DocumentResponseMapper::toResponse)
                .toList();

        int fromIndex = Math.min(page * size, filteredDocuments.size());
        int toIndex = Math.min(fromIndex + size, filteredDocuments.size());
        List<DocumentResponse> items = filteredDocuments.subList(fromIndex, toIndex);

        return PaginationResponse.of(items, page, size, filteredDocuments.size());
    }

    @Transactional
    public DocumentResponse attachDocument(Long notebookId, Long documentId, Long userId) {
        Notebook notebook = resolveOwnedNotebook(notebookId, userId);
        Document document = resolveOwnedDocument(documentId, userId);

        if (notebookDocumentRepository.existsByNotebookIdAndDocumentId(notebookId, documentId)) {
            throw new AppException(ErrorCode.NOTEBOOK_DOCUMENT_DUPLICATE);
        }

        notebookDocumentRepository.save(NotebookDocument.builder()
                .notebook(notebook)
                .document(document)
                .build());

        log.info("Attached document {} to notebook {} for user {}", documentId, notebookId, userId);
        return DocumentResponseMapper.toResponse(document);
    }

    @Transactional
    public NotebookDocumentDeleteResponse detachDocument(Long notebookId, Long documentId, Long userId) {
        resolveOwnedNotebook(notebookId, userId);
        resolveOwnedDocument(documentId, userId);

        NotebookDocument notebookDocument = notebookDocumentRepository.findByNotebookIdAndDocumentId(notebookId, documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND,
                        "Document is not attached to the target notebook"));

        notebookDocumentRepository.delete(notebookDocument);
        log.info("Detached document {} from notebook {} for user {}", documentId, notebookId, userId);

        return NotebookDocumentDeleteResponse.builder()
                .deleted(true)
                .build();
    }

    private Notebook resolveOwnedNotebook(Long notebookId, Long userId) {
        return notebookRepository.findByIdAndUserId(notebookId, userId)
                .orElseThrow(() -> {
                    if (notebookRepository.existsById(notebookId)) {
                        return new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.NOTEBOOK_NOT_FOUND);
                });
    }

    private Document resolveOwnedDocument(Long documentId, Long userId) {
        return documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });
    }

    private boolean matchesKeyword(Document document, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        String normalizedKeyword = keyword.trim().toLowerCase(Locale.ROOT);
        String title = document.getTitle() == null ? "" : document.getTitle().toLowerCase(Locale.ROOT);
        String description = document.getDescription() == null ? "" : document.getDescription().toLowerCase(Locale.ROOT);
        return title.contains(normalizedKeyword) || description.contains(normalizedKeyword);
    }

    private Comparator<Document> resolveComparator(String sort) {
        String normalizedSort = sort == null ? "newest" : sort.trim().toLowerCase(Locale.ROOT);
        return switch (normalizedSort) {
            case "oldest", "createdat,asc" -> Comparator.comparing(Document::getCreatedAt,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "title", "title,asc" -> Comparator.comparing(Document::getTitle,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "title,desc" -> Comparator.comparing(Document::getTitle,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)).reversed();
            default -> Comparator.comparing(Document::getCreatedAt,
                    Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }

    private void validatePaging(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "page must be >= 0 and size must be > 0");
        }
    }
}
