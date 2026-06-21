package com.aistudyhub.module.rag.service;

import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.document.service.DocumentChunkService;
import com.aistudyhub.module.rag.dto.CitedSourceResponse;
import com.aistudyhub.module.rag.dto.RelevantChunkResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RagCoreServiceImpl implements RagCoreService {

    private static final int MAX_EXCERPT_LENGTH = 180;
    private static final int MAX_SUMMARY_CHUNKS = 3;

    private final DocumentChunkService documentChunkService;

    @Override
    public DocumentProcessResponse processDocument(Long documentId, Long currentUserId, DocumentProcessRequest request) {
        return documentChunkService.processDocument(documentId, currentUserId, request);
    }

    @Override
    public List<RelevantChunkResponse> findRelevantChunks(Long notebookId, String question, int topK, Long currentUserId) {
        return documentChunkService.findRelevantChunks(notebookId, currentUserId, question, topK).stream()
                .map(this::toRelevantChunk)
                .toList();
    }

    @Override
    public List<RelevantChunkResponse> getDocumentChunks(Long documentId, Long currentUserId) {
        return documentChunkService.getChunks(documentId, currentUserId).stream()
                .map(this::toRelevantChunk)
                .toList();
    }

    @Override
    public String buildMockAnswer(String question, List<RelevantChunkResponse> relevantChunks) {
        List<CitedSourceResponse> citations = buildCitedSources(relevantChunks);
        if (citations.isEmpty()) {
            return "Mình chưa tìm thấy đoạn tài liệu phù hợp trong notebook hiện tại để trả lời câu hỏi \""
                    + question
                    + "\". Bạn có thể thử hỏi cụ thể hơn hoặc bổ sung thêm tài liệu liên quan.";
        }

        StringBuilder builder = new StringBuilder();
        builder.append("Dựa trên tài liệu trong notebook, đây là phần tóm tắt cho câu hỏi \"")
                .append(question)
                .append("\":");

        citations.stream()
                .limit(MAX_SUMMARY_CHUNKS)
                .forEach(citation -> builder.append("\n- ")
                        .append(citation.getExcerpt()));

        builder.append("\nCác ý trên được tổng hợp từ ")
                .append(citations.stream()
                        .map(CitedSourceResponse::getDocumentTitle)
                        .distinct()
                        .limit(MAX_SUMMARY_CHUNKS)
                        .reduce((left, right) -> left + ", " + right)
                        .orElse("tài liệu trong notebook"))
                .append(".");

        return builder.toString();
    }

    @Override
    public List<CitedSourceResponse> buildCitedSources(List<RelevantChunkResponse> relevantChunks) {
        if (relevantChunks == null || relevantChunks.isEmpty()) {
            return List.of();
        }

        return relevantChunks.stream()
                .map(chunk -> CitedSourceResponse.builder()
                        .documentId(chunk.getDocumentId())
                        .documentTitle(chunk.getDocumentTitle())
                        .chunkIndex(chunk.getChunkIndex())
                        .sourcePage(chunk.getSourcePage())
                        .sourceSection(chunk.getSourceSection())
                        .excerpt(buildExcerpt(chunk.getTextContent()))
                        .build())
                .toList();
    }

    private RelevantChunkResponse toRelevantChunk(DocumentChunkResponse chunk) {
        return RelevantChunkResponse.builder()
                .id(chunk.getId())
                .documentId(chunk.getDocumentId())
                .documentTitle(chunk.getDocumentTitle())
                .chunkIndex(chunk.getChunkIndex())
                .textContent(chunk.getTextContent())
                .tokenEstimate(chunk.getTokenEstimate())
                .sourcePage(chunk.getSourcePage())
                .sourceSection(chunk.getSourceSection())
                .vectorId(chunk.getVectorId())
                .build();
    }

    private String buildExcerpt(String textContent) {
        if (textContent == null || textContent.isBlank()) {
            return "";
        }

        String normalized = textContent.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= MAX_EXCERPT_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, MAX_EXCERPT_LENGTH - 3).trim() + "...";
    }
}
