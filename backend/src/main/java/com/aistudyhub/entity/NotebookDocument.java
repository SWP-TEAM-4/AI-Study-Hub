package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Owner: BE2 – Notebook/Document module (Skeleton created by BE1 for findRelevantChunks)
 * <p>
 * Join table giữa Notebook và Document.
 * Một notebook chứa nhiều document, một document có thể nằm ở nhiều notebook.
 */
@Entity
@Table(name = "notebook_documents", uniqueConstraints = {
        @UniqueConstraint(name = "uk_notebook_document", columnNames = {"notebook_id", "document_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotebookDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notebook_id", nullable = false)
    private Notebook notebook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
}
