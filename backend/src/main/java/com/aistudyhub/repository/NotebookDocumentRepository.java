package com.aistudyhub.repository;

import com.aistudyhub.entity.NotebookDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Owner: BE2 (skeleton by BE1 for findRelevantChunks in BE-016)
 */
public interface NotebookDocumentRepository extends JpaRepository<NotebookDocument, Long> {

    List<NotebookDocument> findByNotebookId(Long notebookId);

    Optional<NotebookDocument> findByNotebookIdAndDocumentId(Long notebookId, Long documentId);

    boolean existsByNotebookIdAndDocumentId(Long notebookId, Long documentId);

    void deleteByNotebookIdAndDocumentId(Long notebookId, Long documentId);
}
