package com.aistudyhub.module.rag.service;

import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.rag.dto.CitedSourceResponse;
import com.aistudyhub.module.rag.dto.RelevantChunkResponse;

import java.util.List;

/**
 * Central contract cho RAG core để các module khác tích hợp thống nhất.
 */
public interface RagCoreService {

    DocumentProcessResponse processDocument(Long documentId, Long currentUserId, DocumentProcessRequest request);

    List<RelevantChunkResponse> findRelevantChunks(Long notebookId, String question, int topK, Long currentUserId);

    List<RelevantChunkResponse> getDocumentChunks(Long documentId, Long currentUserId);

    String buildMockAnswer(String question, List<RelevantChunkResponse> relevantChunks);

    List<CitedSourceResponse> buildCitedSources(List<RelevantChunkResponse> relevantChunks);
}
