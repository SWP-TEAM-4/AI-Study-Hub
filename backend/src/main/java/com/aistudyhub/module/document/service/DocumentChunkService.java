package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.NotebookDocument;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.AiUsageLogs.service.AiUsageService;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.dto.DocumentDeleteChunksResponse;
import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.document.dto.UpdateDocumentChunkRequest;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.module.reputation.service.ReputationService;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentShareLinkRepository;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.locks.ReentrantLock;
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
    private final DocumentShareLinkRepository documentShareLinkRepository;
    private final NotebookRepository notebookRepository;
    private final NotebookDocumentRepository notebookDocumentRepository;
    private final UserRepository userRepository;
    private final TextExtractionService textExtractionService;
    private final GeminiChunkingService geminiChunkingService;
    private final OpenAIEmbeddingService openAIEmbeddingService;
    private final StorageService storageService;
    private final AiUsageService aiUsageService;
    private final CommunityPermissionService communityPermissionService;
    private final ReputationService reputationService;
    private final NotificationService notificationService;
    private final PlatformTransactionManager transactionManager;
    private final ConcurrentMap<Long, ReentrantLock> processingLocks = new ConcurrentHashMap<>();

    // ── 1. Process document → chunks ─────────────────────────────────────────

    /**
     * Trigger processing: extract text từ file → chunk → save vào DB.
     * Nếu document đã có chunks (re-process), xóa chunks cũ trước.
     */
    public DocumentProcessResponse processDocument(Long documentId, Long userId, DocumentProcessRequest request) {
        if (!tryAcquireProcessingLock(documentId)) {
            throw new AppException(ErrorCode.DOCUMENT_ALREADY_PROCESSING);
        }

        boolean processingStarted = false;
        try {
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

            aiUsageService.assertQuotaAvailable(userId, AiActionType.DOCUMENT_CHUNKING, 2);
            boolean reviewExistingChunks = shouldReviewExistingChunks(document, request);
            updateProcessingStatus(documentId, ProcessingStatus.PROCESSING);
            processingStarted = true;

            return transactionTemplate().execute(status -> reviewExistingChunks
                    ? reviewExistingChunksInternal(documentId)
                    : processDocumentInternal(documentId, request));
        } catch (AppException e) {
            if (processingStarted) {
                failProcessing(documentId, e.getMessage());
            }
            throw e;
        } catch (Exception e) {
            if (processingStarted) {
                failProcessing(documentId, e.getMessage());
            }
            throw new AppException(ErrorCode.DOCUMENT_PROCESSING_FAILED,
                    "Processing failed: " + e.getMessage());
        } finally {
            releaseProcessingLock(documentId);
        }
    }

    public void autoProcessUploadedDocument(Long documentId, Long userId) {
        if (!tryAcquireProcessingLock(documentId)) {
            log.info("Skip automatic document processing: documentId={} is already being processed", documentId);
            return;
        }

        boolean processingStarted = false;
        try {
            Optional<Document> optionalDocument = documentRepository.findByIdAndUserId(documentId, userId);
            if (optionalDocument.isEmpty()) {
                log.warn("Skip automatic document processing: documentId={} userId={} is not available",
                        documentId, userId);
                return;
            }

            Document document = optionalDocument.get();
            if (document.getProcessingStatus() == ProcessingStatus.PROCESSING
                    || document.getProcessingStatus() == ProcessingStatus.SUCCESS) {
                log.debug("Skip automatic document processing: documentId={} status={}",
                        documentId, document.getProcessingStatus());
                return;
            }

            aiUsageService.assertQuotaAvailable(userId, AiActionType.DOCUMENT_CHUNKING, 2);
            updateProcessingStatus(documentId, ProcessingStatus.PROCESSING);
            processingStarted = true;
            DocumentProcessResponse response =
                    transactionTemplate().execute(status -> processDocumentInternal(documentId, new DocumentProcessRequest()));
            if (response != null && DocumentModerationStatus.BLOCKED.name().equals(response.getModerationStatus())) {
                log.warn("Automatic document processing blocked documentId={} severity={}",
                        documentId, response.getViolationSeverity());
            }
        } catch (AppException e) {
            if (processingStarted) {
                failProcessing(documentId, e.getMessage());
            }
            log.warn("Automatic document processing failed for documentId={}: {}", documentId, e.getMessage());
        } catch (Exception e) {
            if (processingStarted) {
                failProcessing(documentId, e.getMessage());
            }
            log.error("Automatic document processing failed for documentId={}", documentId, e);
        } finally {
            releaseProcessingLock(documentId);
        }
    }

    // ── 2. Get chunks by document ────────────────────────────────────────────

    /**
     * List tất cả chunks của một document, sắp xếp theo chunkIndex.
     */
    @Transactional(readOnly = true)
    public List<DocumentChunkResponse> getChunks(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        if (!document.getUser().getId().equals(userId)) {
            communityPermissionService.assertReviewerPermissionForDocument(userId, documentId);
        }

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

        aiUsageService.assertQuotaAvailable(userId, AiActionType.DOCUMENT_EMBEDDING);

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
        invalidateDistributionAfterChunkMutation(document,
                "Chunk đã được chỉnh sửa thủ công; tài liệu cần xử lý lại và kiểm duyệt an toàn trước khi chia sẻ.");
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

        invalidateDistributionAfterChunkMutation(document,
                "Chunks đã bị xóa; tài liệu cần xử lý lại và kiểm duyệt an toàn trước khi chia sẻ.");
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

        List<Long> safeDocumentIds = filterDocumentsReadyForRag(documentIds);
        if (requestedDocumentIds != null && !requestedDocumentIds.isEmpty()
                && safeDocumentIds.size() != documentIds.size()) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_SAFE_FOR_DISTRIBUTION,
                    "One or more selected documents have not passed safety review.");
        }
        documentIds = safeDocumentIds;
        if (documentIds.isEmpty()) {
            log.debug("No safety-reviewed documents available in notebook {}", notebookId);
            return List.of();
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

    private boolean tryAcquireProcessingLock(Long documentId) {
        ReentrantLock lock = processingLocks.computeIfAbsent(documentId, ignored -> new ReentrantLock());
        return lock.tryLock();
    }

    private void releaseProcessingLock(Long documentId) {
        ReentrantLock lock = processingLocks.get(documentId);
        if (lock == null || !lock.isHeldByCurrentThread()) {
            return;
        }
        lock.unlock();
        if (!lock.isLocked() && !lock.hasQueuedThreads()) {
            processingLocks.remove(documentId, lock);
        }
    }

    private boolean shouldReviewExistingChunks(Document document, DocumentProcessRequest request) {
        return document != null
                && document.getModerationStatus() == DocumentModerationStatus.REVIEW_REQUIRED
                && (request == null || !StringUtils.hasText(request.getMockText()))
                && documentChunkRepository.countByDocumentId(document.getId()) > 0;
    }

    private List<Long> filterDocumentsReadyForRag(List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return List.of();
        }
        Set<Long> safeIds = documentRepository.findAllById(documentIds).stream()
                .filter(document -> document.getProcessingStatus() == ProcessingStatus.SUCCESS)
                .filter(document -> document.getModerationStatus() == DocumentModerationStatus.SAFE)
                .map(Document::getId)
                .collect(Collectors.toSet());
        return documentIds.stream()
                .filter(safeIds::contains)
                .distinct()
                .toList();
    }

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

    private DocumentProcessResponse reviewExistingChunksInternal(Long documentId) {
        Document document = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId);
        if (chunks.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT,
                    "Document has no chunks to review. Re-run chunking from the source file.");
        }

        String reviewText = buildExistingChunksReviewText(chunks);
        GeminiChunkingService.SafetyReview safetyReview = geminiChunkingService.reviewTextSafety(reviewText);
        List<TextChunkingService.ChunkResult> chunkResults = chunks.stream()
                .map(chunk -> new TextChunkingService.ChunkResult(
                        chunk.getChunkIndex(),
                        chunk.getTextContent(),
                        chunk.getTokenEstimate(),
                        chunk.getSourcePage(),
                        chunk.getSourceSection(),
                        null))
                .toList();

        if (shouldBlockDocument(safetyReview)) {
            applyModerationBlock(document, safetyReview);
            safeLogAiUsage(document.getUser().getId(), AiActionType.DOCUMENT_CHUNKING,
                    estimateDocumentChunkingTokens(reviewText, chunkResults));

            return DocumentProcessResponse.builder()
                    .documentId(documentId)
                    .processingStatus(ProcessingStatus.FAILED.name())
                    .moderationStatus(DocumentModerationStatus.BLOCKED.name())
                    .violationSeverity(resolveSeverity(safetyReview).name())
                    .moderationNote(buildModerationNote(safetyReview))
                    .chunkCount(0)
                    .chunks(List.of())
                    .message("Edited chunks blocked by Gemini safety moderation: "
                            + buildModerationNote(safetyReview))
                    .build();
        }

        document.setProcessingStatus(ProcessingStatus.SUCCESS);
        document.setModerationStatus(DocumentModerationStatus.SAFE);
        document.setViolationSeverity(resolveSeverity(safetyReview));
        document.setModerationNote(buildModerationNote(safetyReview));
        document.setModeratedAt(LocalDateTime.now());
        document.setAiVerdictNote("Gemini safety review passed for edited chunks: "
                + buildModerationNote(safetyReview));
        documentRepository.save(document);

        List<DocumentChunkResponse> responses = chunks.stream()
                .map(chunk -> toResponse(chunk, document.getTitle()))
                .toList();
        safeLogAiUsage(document.getUser().getId(), AiActionType.DOCUMENT_CHUNKING,
                estimateDocumentChunkingTokens(reviewText, chunkResults));

        log.info("Document {} edited chunks safety review passed without re-chunking: {} chunks preserved",
                documentId, responses.size());

        return DocumentProcessResponse.builder()
                .documentId(documentId)
                .processingStatus(ProcessingStatus.SUCCESS.name())
                .moderationStatus(DocumentModerationStatus.SAFE.name())
                .violationSeverity(resolveSeverity(safetyReview).name())
                .moderationNote(buildModerationNote(safetyReview))
                .chunkCount(responses.size())
                .chunks(responses)
                .message("Edited chunks safety review passed. Manual chunk edits were preserved.")
                .build();
    }

    private String buildExistingChunksReviewText(List<DocumentChunk> chunks) {
        return chunks.stream()
                .map(chunk -> "[[CHUNK:" + chunk.getChunkIndex() + "]]\n"
                        + normalizeReason(chunk.getTextContent(), ""))
                .collect(Collectors.joining("\n\n"));
    }

    private DocumentProcessResponse processDocumentInternal(Long documentId, DocumentProcessRequest request) {
        Document document = documentRepository.findByIdForUpdate(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        documentChunkRepository.deleteByDocumentId(documentId);
        documentChunkRepository.flush();

        String rawText = request != null && request.getMockText() != null && !request.getMockText().isBlank()
                ? request.getMockText()
                : textExtractionService.extractText(document);

        if (rawText == null || rawText.isBlank()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT);
        }

        GeminiChunkingService.ModeratedChunkingOutcome chunkingOutcome = geminiChunkingService.chunkTextWithSafetyReview(
                rawText,
                request != null ? request.getChunkSize() : null,
                request != null ? request.getOverlap() : null);
        List<TextChunkingService.ChunkResult> chunkResults = chunkingOutcome.chunks();
        GeminiChunkingService.SafetyReview safetyReview = chunkingOutcome.safetyReview();

        if (shouldBlockDocument(safetyReview)) {
            applyModerationBlock(document, safetyReview);
            logDocumentAiUsage(document.getUser().getId(), rawText, chunkingOutcome.strategy(), chunkResults, false);

            return DocumentProcessResponse.builder()
                    .documentId(documentId)
                    .processingStatus(ProcessingStatus.FAILED.name())
                    .moderationStatus(DocumentModerationStatus.BLOCKED.name())
                    .violationSeverity(resolveSeverity(safetyReview).name())
                    .moderationNote(buildModerationNote(safetyReview))
                    .chunkCount(0)
                    .chunks(List.of())
                    .message("Document blocked by Gemini safety moderation: " + buildModerationNote(safetyReview))
                    .build();
        }

        if (chunkResults.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT,
                    "Gemini safety review produced no chunks");
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
        document.setModerationStatus(DocumentModerationStatus.SAFE);
        document.setViolationSeverity(resolveSeverity(safetyReview));
        document.setModerationNote(buildModerationNote(safetyReview));
        document.setModeratedAt(LocalDateTime.now());
        document.setAiVerdictNote("Gemini safety review passed: " + buildModerationNote(safetyReview));
        documentRepository.save(document);

        List<DocumentChunkResponse> responses = savedChunks.stream()
                .map(chunk -> toResponse(chunk, document.getTitle()))
                .toList();

        logDocumentAiUsage(document.getUser().getId(), rawText, chunkingOutcome.strategy(), chunkResults, true);

        log.info("Document {} processed safely with {} + OpenAI embeddings: {} chunks created",
                documentId,
                chunkingOutcome.strategy() == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC
                        ? "Gemini safety review and semantic chunking"
                        : "local heuristic chunking fallback",
                responses.size());

        return DocumentProcessResponse.builder()
                .documentId(documentId)
                .processingStatus(ProcessingStatus.SUCCESS.name())
                .moderationStatus(DocumentModerationStatus.SAFE.name())
                .violationSeverity(resolveSeverity(safetyReview).name())
                .moderationNote(buildModerationNote(safetyReview))
                .chunkCount(responses.size())
                .chunks(responses)
                .message("Processed with "
                        + (chunkingOutcome.strategy() == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC
                        ? "Gemini safety review and semantic chunking"
                        : "local heuristic chunking fallback")
                        + " and OpenAI embeddings: "
                        + responses.size()
                        + " chunks")
                .build();
    }

    private void invalidateDistributionAfterChunkMutation(Document document, String reason) {
        document.setProcessingStatus(ProcessingStatus.PENDING);
        document.setModerationStatus(DocumentModerationStatus.REVIEW_REQUIRED);
        document.setViolationSeverity(DocumentViolationSeverity.NONE);
        document.setModerationNote(reason);
        document.setModeratedAt(null);
        document.setVisibility(Visibility.PRIVATE);
        document.setMarketStatus(MarketStatus.NONE);
        disableShareLink(document.getId());
    }

    private boolean shouldBlockDocument(GeminiChunkingService.SafetyReview safetyReview) {
        return safetyReview == null
                || !safetyReview.safe()
                || severityAtLeast(resolveSeverity(safetyReview), DocumentViolationSeverity.MEDIUM);
    }

    private void applyModerationBlock(Document document, GeminiChunkingService.SafetyReview safetyReview) {
        String moderationNote = buildModerationNote(safetyReview);
        DocumentViolationSeverity severity = resolveSeverity(safetyReview);

        documentChunkRepository.deleteByDocumentId(document.getId());
        disableShareLink(document.getId());
        deleteStoredFile(document);

        document.setProcessingStatus(ProcessingStatus.FAILED);
        document.setModerationStatus(DocumentModerationStatus.BLOCKED);
        document.setViolationSeverity(severity);
        document.setModerationNote(moderationNote);
        document.setModeratedAt(LocalDateTime.now());
        document.setVisibility(Visibility.PRIVATE);
        document.setMarketStatus(MarketStatus.REJECTED);
        document.setAiVerdictNote("Gemini safety review blocked this document: " + moderationNote);
        documentRepository.save(document);

        applyModerationPenalty(document, moderationNote);
        banOwnerIfCritical(document, severity, moderationNote);
        notifyModerationBlocked(document, severity, moderationNote);

        log.warn("Document {} blocked by Gemini safety review. severity={}, note={}",
                document.getId(), severity, moderationNote);
    }

    private void deleteStoredFile(Document document) {
        if (!StringUtils.hasText(document.getCloudFilePath())) {
            document.setFileUrl(null);
            document.setCloudFilePath(null);
            return;
        }
        try {
            storageService.deleteFile(document.getCloudFilePath());
        } catch (Exception ex) {
            log.warn("Failed to delete blocked document file documentId={} path={}: {}",
                    document.getId(), document.getCloudFilePath(), ex.getMessage());
        }
        document.setFileUrl(null);
        document.setCloudFilePath(null);
    }

    private void applyModerationPenalty(Document document, String moderationNote) {
        if (document.getUser() == null || document.getUser().getId() == null) {
            return;
        }
        try {
            reputationService.applyConfiguredEvent(
                    document.getUser().getId(),
                    document.getSubject() != null ? document.getSubject().getId() : null,
                    ReputationEventType.CONTENT_HIDDEN_PENALTY,
                    "DOCUMENT",
                    document.getId(),
                    "DOCUMENT_MODERATION",
                    document.getId(),
                    moderationNote,
                    "document-moderation-blocked-" + document.getId(),
                    null);
        } catch (Exception ex) {
            log.warn("Failed to apply moderation reputation penalty for documentId={}: {}",
                    document.getId(), ex.getMessage());
        }
    }

    private void banOwnerIfCritical(Document document, DocumentViolationSeverity severity, String moderationNote) {
        if (severity != DocumentViolationSeverity.CRITICAL
                || document.getUser() == null
                || document.getUser().getId() == null) {
            return;
        }
        try {
            User user = userRepository.findById(document.getUser().getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            user.setIsActive(false);
            userRepository.save(user);
            notificationService.createNotification(
                    user.getId(),
                    "Tài khoản đã bị khóa do vi phạm nghiêm trọng",
                    "Tài liệu \"" + document.getTitle() + "\" bị chặn ở mức CRITICAL. " + moderationNote);
            log.warn("User {} deactivated because document {} was classified as CRITICAL",
                    user.getId(), document.getId());
        } catch (Exception ex) {
            log.warn("Failed to deactivate owner after critical moderation documentId={}: {}",
                    document.getId(), ex.getMessage());
        }
    }

    private void notifyModerationBlocked(Document document, DocumentViolationSeverity severity, String moderationNote) {
        if (document.getUser() == null || document.getUser().getId() == null) {
            return;
        }
        try {
            notificationService.createNotification(
                    document.getUser().getId(),
                    "Tài liệu bị chặn bởi kiểm duyệt an toàn",
                    "Tài liệu \"" + document.getTitle() + "\" bị vô hiệu hóa ở mức "
                            + severity + ". " + moderationNote);
        } catch (Exception ex) {
            log.warn("Failed to create moderation notification for documentId={}: {}",
                    document.getId(), ex.getMessage());
        }
    }

    private void disableShareLink(Long documentId) {
        documentShareLinkRepository.findByDocumentId(documentId).ifPresent(shareLink -> {
            shareLink.setEnabled(false);
            shareLink.setAllowPreview(false);
            shareLink.setAllowDownload(false);
            documentShareLinkRepository.save(shareLink);
            log.info("Disabled share link {} for document {}", shareLink.getId(), documentId);
        });
    }

    private DocumentViolationSeverity resolveSeverity(GeminiChunkingService.SafetyReview safetyReview) {
        if (safetyReview == null || safetyReview.severity() == null) {
            return DocumentViolationSeverity.HIGH;
        }
        return safetyReview.severity();
    }

    private boolean severityAtLeast(DocumentViolationSeverity actual, DocumentViolationSeverity threshold) {
        return severityRank(actual) >= severityRank(threshold);
    }

    private int severityRank(DocumentViolationSeverity severity) {
        if (severity == null) {
            return severityRank(DocumentViolationSeverity.HIGH);
        }
        return switch (severity) {
            case NONE -> 0;
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 4;
        };
    }

    private String buildModerationNote(GeminiChunkingService.SafetyReview safetyReview) {
        if (safetyReview == null) {
            return "severity=HIGH; category=UNKNOWN; confidence=0.00; reason=Gemini safety review was missing.";
        }
        String flags = safetyReview.policyFlags() == null || safetyReview.policyFlags().isEmpty()
                ? "NONE"
                : String.join(",", safetyReview.policyFlags());
        return "severity=" + resolveSeverity(safetyReview).name()
                + "; category=" + normalizeReason(safetyReview.category(), "UNKNOWN")
                + "; confidence=" + String.format(Locale.ROOT, "%.2f", safetyReview.confidence())
                + "; flags=" + flags
                + "; reason=" + normalizeReason(safetyReview.reason(), "Gemini did not provide a reason.");
    }

    private String normalizeReason(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private void failProcessing(Long documentId, String reason) {
        log.error("Document {} processing failed: {}", documentId, reason);
        transactionTemplate().executeWithoutResult(transactionStatus -> {
            Document managedDocument = documentRepository.findById(documentId)
                    .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
            managedDocument.setProcessingStatus(ProcessingStatus.FAILED);
            if (managedDocument.getModerationStatus() != DocumentModerationStatus.BLOCKED) {
                managedDocument.setModerationStatus(DocumentModerationStatus.REVIEW_REQUIRED);
                managedDocument.setViolationSeverity(DocumentViolationSeverity.LOW);
                managedDocument.setModerationNote(normalizeReason(reason,
                        "Document processing failed; safety review did not complete."));
                managedDocument.setModeratedAt(LocalDateTime.now());
                managedDocument.setVisibility(Visibility.PRIVATE);
                managedDocument.setMarketStatus(MarketStatus.NONE);
                disableShareLink(documentId);
            }
            documentRepository.save(managedDocument);
        });
    }

    private void updateProcessingStatus(Long documentId, ProcessingStatus status) {
        transactionTemplate().executeWithoutResult(transactionStatus -> {
            Document managedDocument = documentRepository.findById(documentId)
                    .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
            managedDocument.setProcessingStatus(status);
            if (status == ProcessingStatus.PROCESSING) {
                managedDocument.setModerationStatus(DocumentModerationStatus.PENDING);
                managedDocument.setViolationSeverity(DocumentViolationSeverity.NONE);
                managedDocument.setModerationNote("Document is being safety-checked by Gemini.");
                managedDocument.setModeratedAt(null);
            }
            documentRepository.save(managedDocument);
        });
    }

    private void logDocumentAiUsage(Long userId,
                                    String rawText,
                                    GeminiChunkingService.ChunkingStrategy chunkingStrategy,
                                    List<TextChunkingService.ChunkResult> chunkResults,
                                    boolean includeEmbeddingUsage) {
        if (chunkingStrategy == GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC) {
            safeLogAiUsage(userId, AiActionType.DOCUMENT_CHUNKING,
                    estimateDocumentChunkingTokens(rawText, chunkResults));
        }
        if (includeEmbeddingUsage) {
            safeLogAiUsage(userId, AiActionType.DOCUMENT_EMBEDDING,
                    estimateDocumentEmbeddingTokens(chunkResults));
        }
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
