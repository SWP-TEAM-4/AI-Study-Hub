package com.aistudyhub.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Owner: BE1 – RAG Core module
 * <p>
 * Mỗi DocumentChunk là một đoạn text được tách từ Document gốc.
 * Dùng cho RAG retrieval: Chat AI sẽ query chunks để trả lời câu hỏi.
 * <p>
 * vectorId hiện tại là mock UUID. Production sẽ chứa ID từ Vector DB
 * (Pinecone, Weaviate, Qdrant...) sau khi embedding.
 */
@Entity
@Table(name = "document_chunks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_document_chunk_index", columnNames = {"document_id", "chunk_index"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "text_content", nullable = false, columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "token_estimate")
    private Integer tokenEstimate;

    @Column(name = "source_page")
    private Integer sourcePage;

    @Column(name = "source_section", length = 255)
    private String sourceSection;

    @Column(name = "embedding_vector", columnDefinition = "TEXT")
    private String embeddingVector;

    @Column(name = "embedding_model", length = 100)
    private String embeddingModel;

    @Column(name = "vector_id", length = 255)
    private String vectorId;
}
