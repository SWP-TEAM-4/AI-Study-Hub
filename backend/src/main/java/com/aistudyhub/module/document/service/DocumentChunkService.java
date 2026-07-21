package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.dto.DocumentDeleteChunksResponse;
import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentChunkRequest;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Owner: BE1 – RAG Core
 * <p>
 * Core service xử lý Document → Chunks cho RAG pipeline.
 * <p>
 * Flow:
 * 1. POST /process → extract text → chunk → save → update status
 * 2. GET /chunks → return saved chunks
 * 3. DELETE /chunks → cleanup → reset status
 * 4. findRelevantChunks() → BE-017/018 gọi cho Chat/RAG
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentChunkService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final NotebookRepository notebookRepository;
    private final NotebookDocumentRepository notebookDocumentRepository;
    private final TextExtractionService textExtractionService;
    private final GeminiChunkingService geminiChunkingService;
    private final OpenAIEmbeddingService openAIEmbeddingService;
    private final AiUsageService aiUsageService;
    private final PlatformTransactionManager transactionManager;

    // ── 1. Process document → chunks ─────────────────────────────────────────

    /**
     * Trigger processing: extract text từ file → chunk → save vào DB.
     * Nếu document đã có chunks (re-process), xóa chunks cũ trước.
     */
    public DocumentProcessResponse processDocument(Long documentId, Long userId, DocumentProcessRequest request) {
        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });

        if (document.getProcessingStatus() == ProcessingStatus.PROCESSING) {
            throw new AppException(ErrorCode.DOCUMENT_ALREADY_PROCESSING);
        }

        aiUsageService.assertQuotaAvailable(userId, AiActionType.DOCUMENT_CHUNKING);
        updateProcessingStatus(documentId, ProcessingStatus.PROCESSING);

        try {
            return transactionTemplate().execute(status -> processDocumentInternal(documentId, request));
        } catch (AppException e) {
            failProcessing(documentId, e.getMessage());
            throw e;
        } catch (Exception e) {
            failProcessing(documentId, e.getMessage());
            throw new AppException(ErrorCode.DOCUMENT_PROCESSING_FAILED,
                    "Processing failed: " + e.getMessage());
        }
    }

    // ── 2. Get chunks by document ────────────────────────────────────────────

    /**
     * List tất cả chunks của một document, sắp xếp theo chunkIndex.
     */
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> getChunks(Long documentId, Long userId) {
        // Validate document exists & ownership
        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId);

        return chunks.stream()
                .map(chunk -> toResponse(chunk, document.getTitle()))
                .toList();
    }

    /**
     * Update one extracted chunk and refresh its embedding so RAG retrieval stays in sync.
     */
    @Transactional
    public DocumentChunkResponse updateChunk(Long documentId, Long chunkId, Long userId,
                                             UpdateDocumentChunkRequest request) {
        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });

        if (document.getProcessingStatus() == ProcessingStatus.PROCESSING) {
            throw new AppException(ErrorCode.DOCUMENT_ALREADY_PROCESSING);
        }

        if (request == null || request.getTextContent() == null || request.getTextContent().trim().isBlank()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT, "Chunk text content must not be blank");
        }

        DocumentChunk chunk = documentChunkRepository.findByIdAndDocumentId(chunkId, documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND, "Document chunk not found"));

        String textContent = request.getTextContent().trim();
        OpenAIEmbeddingService.EmbeddingResult embeddingResult =
                openAIEmbeddingService.generateChunkEmbedding(documentId, chunk.getChunkIndex(), textContent);

        chunk.setTextContent(textContent);
        chunk.setTokenEstimate(capToInteger(estimateTextTokens(textContent)));
        chunk.setEmbeddingVector(embeddingResult.embeddingVector());
        chunk.setEmbeddingModel(embeddingResult.embeddingModel());
        chunk.setVectorId(embeddingResult.vectorId());

        DocumentChunk savedChunk = documentChunkRepository.save(chunk);
        safeLogAiUsage(userId, AiActionType.DOCUMENT_EMBEDDING, savedChunk.getTokenEstimate());

        log.info("Updated text and embedding for document {} chunk {}", documentId, chunkId);
        return toResponse(savedChunk, document.getTitle());
    }

    // ── 3. Delete chunks ─────────────────────────────────────────────────────

    /**
     * Xóa tất cả chunks của document và reset processingStatus về PENDING.
     */
    @Transactional
    public DocumentDeleteChunksResponse deleteChunks(Long documentId, Long userId) {
        // Validate document exists & ownership
        Document document = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> {
                    if (documentRepository.existsById(documentId)) {
                        return new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
                });

        long deletedCount = documentChunkRepository.countByDocumentId(documentId);
        documentChunkRepository.deleteByDocumentId(documentId);

        // Reset processing status
        document.setProcessingStatus(ProcessingStatus.PENDING);
        documentRepository.save(document);

        log.info("Deleted {} chunks for document {}. Status reset to PENDING.", deletedCount, documentId);

        return DocumentDeleteChunksResponse.builder()
                .deleted(true)
                .deletedCount(deletedCount)
                .processingStatus(ProcessingStatus.PENDING.name())
                .build();
    }

    // ── 4. Find relevant chunks for RAG ──────────────────────────────────────

    /**
     * Tìm các chunks liên quan đến câu hỏi từ tất cả documents trong notebook.
     * <p>
     * MVP: Mock ranking bằng keyword overlap (simple TF matching).
     * Production: Gọi Vector DB similarity search (Pinecone/Weaviate/Qdrant).
     *
     * @param notebookId ID notebook chứa documents
     * @param question   câu hỏi của user
     * @param topK       số lượng chunks trả về (default 5)
     * @return danh sách chunks sắp xếp theo relevance score giảm dần
     */
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> findRelevantChunks(Long notebookId, String question, int topK) {
        return findRelevantChunks(notebookId, null, null, question, topK);
    }

    /**
     * Overload có validate ownership notebook để BE-017/018 dùng an toàn.
     */
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> findRelevantChunks(Long notebookId, Long userId, String question, int topK) {
        return findRelevantChunks(notebookId, userId, null, question, topK);
    }

    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> findRelevantChunks(Long notebookId, Long userId, List<Long> requestedDocumentIds,
                                                          String question, int topK) {
        if (userId != null) {
            Notebook notebook = notebookRepository.findByIdAndUserId(notebookId, userId)
                    .orElseThrow(() -> {
                        if (notebookRepository.existsById(notebookId)) {
                            return new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
                        }
                        return new AppException(ErrorCode.NOTEBOOK_NOT_FOUND);
                    });
            log.debug("Resolved notebook {} for user {} before retrieving relevant chunks", notebook.getId(), userId);
        } else if (!notebookRepository.existsById(notebookId)) {
            throw new AppException(ErrorCode.NOTEBOOK_NOT_FOUND);
        }

        // 1. Lấy tất cả document IDs thuộc notebook
        List<NotebookDocument> notebookDocs = notebookDocumentRepository.findByNotebookId(notebookId);

        if (notebookDocs.isEmpty()) {
            log.debug("No documents found in notebook {}", notebookId);
            return List.of();
        }

        List<Long> notebookDocumentIds = notebookDocs.stream()
                .map(nd -> nd.getDocument().getId())
                .toList();

        List<Long> documentIds = notebookDocumentIds;
        if (requestedDocumentIds != null && !requestedDocumentIds.isEmpty()) {
            Set<Long> allowedDocumentIds = new HashSet<>(notebookDocumentIds);
            boolean invalidDocumentId = requestedDocumentIds.stream()
                    .anyMatch(documentId -> documentId == null || !allowedDocumentIds.contains(documentId));
            if (invalidDocumentId) {
                throw new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED,
                        "One or more documentIds do not belong to the current notebook");
            }
            documentIds = requestedDocumentIds.stream().distinct().toList();
        }

        // 2. Lấy tất cả chunks thuộc các documents
        List<DocumentChunk> allChunks = documentChunkRepository
                .findByDocumentIdInOrderByDocumentIdAscChunkIndexAsc(documentIds);

        if (allChunks.isEmpty()) {
            log.debug("No chunks found for documents {} in notebook {}", documentIds, notebookId);
            return List.of();
        }

        List<DocumentChunkResponse> vectorRankedChunks = findRelevantChunksByEmbeddings(allChunks, question, topK);
        if (!vectorRankedChunks.isEmpty()) {
            return vectorRankedChunks;
        }

        // 3. Tokenize question thành keywords
        Set<String> keywords = tokenizeQuestion(question);

        if (keywords.isEmpty()) {
            // Nếu không có keyword hợp lệ, trả top K chunks đầu tiên
            return allChunks.stream()
                    .limit(topK)
                    .map(chunk -> toResponse(chunk, chunk.getDocument().getTitle()))
                    .toList();
        }

        // 4. Score mỗi chunk theo keyword overlap
        List<ScoredChunk> scoredChunks = allChunks.stream()
                .map(chunk -> {
                    int score = calculateRelevanceScore(chunk.getTextContent(), keywords);
                    return new ScoredChunk(chunk, score);
                })
                .sorted(Comparator.comparingInt(ScoredChunk::score).reversed())
                .limit(topK)
                .toList();

        // 5. Convert to response
        return scoredChunks.stream()
                .map(sc -> toResponse(sc.chunk(), sc.chunk().getDocument().getTitle()))
                .toList();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private record ScoredChunk(DocumentChunk chunk, int score) {
    }

    /**
     * Tokenize question: lowercase, split by whitespace/punctuation, remove stopwords.
     */
    private Set<String> tokenizeQuestion(String question) {
        if (question == null || question.isBlank()) return Set.of();

        // Common English + Vietnamese stopwords
        Set<String> stopwords = Set.of(
                "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
                "have", "has", "had", "do", "does", "did", "will", "would", "shall",
                "should", "may", "might", "must", "can", "could", "to", "of", "in",
                "for", "on", "with", "at", "by", "from", "as", "into", "about",
                "and", "or", "but", "not", "this", "that", "these", "those", "it",
                "its", "i", "me", "my", "we", "our", "you", "your", "he", "she",
                "him", "her", "they", "them", "their", "what", "which", "who",
                "là", "và", "của", "cho", "với", "trong", "từ", "đến", "được",
                "có", "không", "này", "đó", "các", "một", "những", "tôi", "bạn"
        );

        return Arrays.stream(question.toLowerCase().split("[\\s,.!?;:()\\[\\]{}\"']+"))
                .filter(word -> word.length() > 1)
                .filter(word -> !stopwords.contains(word))
                .collect(Collectors.toSet());
    }

    /**
     * Calculate simple relevance score: count keyword occurrences in chunk text.
     */
    private int calculateRelevanceScore(String chunkText, Set<String> keywords) {
        if (chunkText == null || chunkText.isBlank()) return 0;

        String lowerChunk = chunkText.toLowerCase();
        int score = 0;
        for (String keyword : keywords) {
            // Count occurrences
            int idx = 0;
            while ((idx = lowerChunk.indexOf(keyword, idx)) != -1) {
                score++;
                idx += keyword.length();
            }
        }
        return score;
    }

    private List<DocumentChunkResponse> findRelevantChunksByEmbeddings(
            List<DocumentChunk> allChunks,
            String question,
            int topK) {
        if (question == null || question.isBlank()) {
            return List.of();
        }

        List<DocumentChunk> embeddedChunks = allChunks.stream()
                .filter(chunk -> chunk.getEmbeddingVector() != null && !chunk.getEmbeddingVector().isBlank())
                .toList();

        if (embeddedChunks.isEmpty()) {
            return List.of();
        }

        try {
            List<Double> questionEmbedding = openAIEmbeddingService.generateQueryEmbedding(question);
            List<ScoredChunk> scoredChunks = embeddedChunks.stream()
                    .map(chunk -> new ScoredChunk(
                            chunk,
                            (int) Math.round(openAIEmbeddingService.cosineSimilarity(
                                    openAIEmbeddingService.parseEmbeddingVector(chunk.getEmbeddingVector()),
                                    questionEmbedding) * 10000)))
                    .sorted(Comparator.comparingInt(ScoredChunk::score).reversed())
                    .limit(topK)
                    .toList();

            if (scoredChunks.isEmpty() || scoredChunks.get(0).score() <= 0) {
                return List.of();
            }

            log.debug("Returning {} chunks ranked by OpenAI embedding similarity", scoredChunks.size());
            return scoredChunks.stream()
                    .map(scoredChunk -> toResponse(scoredChunk.chunk(), scoredChunk.chunk().getDocument().getTitle()))
                    .toList();
        } catch (AppException e) {
            log.warn("Embedding-based retrieval unavailable, fallback to keyword overlap: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Map DocumentChunk entity → DocumentChunkResponse DTO.
     */
    private DocumentChunkResponse toResponse(DocumentChunk chunk, String documentTitle) {
        return DocumentChunkResponse.builder()
                .id(chunk.getId())
                .documentId(chunk.getDocument().getId())
                .documentTitle(documentTitle)
                .chunkIndex(chunk.getChunkIndex())
                .textContent(chunk.getTextContent())
                .tokenEstimate(chunk.getTokenEstimate())
                .sourcePage(chunk.getSourcePage())
                .sourceSection(chunk.getSourceSection())
                .vectorId(chunk.getVectorId())
                .build();
    }

    private DocumentProcessResponse processDocumentInternal(Long documentId, DocumentProcessRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        documentChunkRepository.deleteByDocumentId(documentId);
        documentChunkRepository.flush();

        String rawText = request != null && request.getMockText() != null && !request.getMockText().isBlank()
                ? request.getMockText()
                : textExtractionService.extractText(document);

        if (rawText == null || rawText.isBlank()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT);
        }

        GeminiChunkingService.ChunkingOutcome chunkingOutcome = geminiChunkingService.chunkTextWithMetadata(
                rawText,
                request != null ? request.getChunkSize() : null,
                request != null ? request.getOverlap() : null);
        List<TextChunkingService.ChunkResult> chunkResults = chunkingOutcome.chunks();

        if (chunkResults.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT,
                    "Gemini semantic chunking produced no results");
        }

        Map<Integer, OpenAIEmbeddingService.EmbeddingResult> embeddingResults =
                openAIEmbeddingService.generateBatchEmbeddings(
                        documentId,
                        chunkResults.stream().map(TextChunkingService.ChunkResult::content).toList());

        List<DocumentChunk> chunks = chunkResults.stream()
                .map(chunkResult -> {
                    OpenAIEmbeddingService.EmbeddingResult embeddingResult = embeddingResults.get(chunkResult.index());
                    if (embeddingResult == null) {
                        throw new AppException(ErrorCode.EMBEDDING_GENERATION_FAILED,
                                "Missing embedding result for chunk index " + chunkResult.index());
                    }
                    return DocumentChunk.builder()
                            .document(document)
                            .chunkIndex(chunkResult.index())
                            .textContent(chunkResult.content())
                            .tokenEstimate(chunkResult.tokenEstimate())
                            .sourcePage(chunkResult.sourcePage())
                            .sourceSection(chunkResult.sourceSection())
                            .embeddingVector(embeddingResult.embeddingVector())
                            .embeddingModel(embeddingResult.embeddingModel())
                            .vectorId(embeddingResult.vectorId())
                            .build();
                })
                .toList();

        List<DocumentChunk> savedChunks = documentChunkRepository.saveAll(chunks);
        document.setProcessingStatus(ProcessingStatus.SUCCESS);
        documentRepository.save(document);

        List<DocumentChunkResponse> responses = savedChunks.stream()
                .map(chunk -> toResponse(chunk, document.getTitle()))
                .toList();

        logDocumentAiUsage(document.getUser().getId(), rawText, chunkingOutcome, chunkResults);

        log.info("Document {} processed successfully with {} + OpenAI embeddings: {} chunks created",
                documentId,
                chunkingOutcome.strategy() == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC
                        ? "Gemini semantic chunking"
                        : "local heuristic chunking fallback",
                responses.size());

        return DocumentProcessResponse.builder()
                .documentId(documentId)
                .processingStatus(ProcessingStatus.SUCCESS.name())
                .chunkCount(responses.size())
                .chunks(responses)
                .message("Processed with "
                        + (chunkingOutcome.strategy() == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC
                        ? "Gemini semantic chunking"
                        : "local heuristic chunking fallback")
                        + " and OpenAI embeddings: "
                        + responses.size()
                        + " chunks")
                .build();
    }

    private void failProcessing(Long documentId, String reason) {
        log.error("Document {} processing failed: {}", documentId, reason);
        updateProcessingStatus(documentId, ProcessingStatus.FAILED);
    }

    private void updateProcessingStatus(Long documentId, ProcessingStatus status) {
        transactionTemplate().executeWithoutResult(transactionStatus -> {
            Document managedDocument = documentRepository.findById(documentId)
                    .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
            managedDocument.setProcessingStatus(status);
            documentRepository.save(managedDocument);
        });
    }

    private void logDocumentAiUsage(Long userId,
                                    String rawText,
                                    GeminiChunkingService.ChunkingOutcome chunkingOutcome,
                                    List<TextChunkingService.ChunkResult> chunkResults) {
        if (chunkingOutcome.strategy() == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC) {
            safeLogAiUsage(userId, AiActionType.DOCUMENT_CHUNKING,
                    estimateDocumentChunkingTokens(rawText, chunkResults));
        }
        safeLogAiUsage(userId, AiActionType.DOCUMENT_EMBEDDING,
                estimateDocumentEmbeddingTokens(chunkResults));
    }

    private int estimateDocumentChunkingTokens(String rawText, List<TextChunkingService.ChunkResult> chunkResults) {
        long inputTokens = estimateTextTokens(rawText);
        long outputTokens = sumChunkTokens(chunkResults);
        return capToInteger(inputTokens + outputTokens);
    }

    private int estimateDocumentEmbeddingTokens(List<TextChunkingService.ChunkResult> chunkResults) {
        return capToInteger(sumChunkTokens(chunkResults));
    }

    private long sumChunkTokens(List<TextChunkingService.ChunkResult> chunkResults) {
        if (chunkResults == null || chunkResults.isEmpty()) {
            return 0L;
        }
        return chunkResults.stream()
                .mapToLong(chunk -> chunk.tokenEstimate() != null && chunk.tokenEstimate() > 0
                        ? chunk.tokenEstimate()
                        : estimateTextTokens(chunk.content()))
                .sum();
    }

    private long estimateTextTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0L;
        }
        return Math.max(1L, (long) Math.ceil(text.trim().length() / 4.0));
    }

    private int capToInteger(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) Math.max(value, 0L);
    }

    private void safeLogAiUsage(Long userId, AiActionType actionType, Integer tokenCount) {
        try {
            aiUsageService.logUsage(userId, actionType, tokenCount);
        } catch (Exception ex) {
            log.warn("Failed to persist AI usage log for document processing userId={} actionType={}: {}",
                    userId, actionType, ex.getMessage());
        }
    }

    private TransactionTemplate transactionTemplate() {
        return new TransactionTemplate(transactionManager);
    }
}
