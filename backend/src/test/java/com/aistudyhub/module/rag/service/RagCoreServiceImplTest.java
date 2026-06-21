package com.aistudyhub.module.rag.service;

import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.document.dto.DocumentProcessRequest;
import com.aistudyhub.module.document.dto.DocumentProcessResponse;
import com.aistudyhub.module.document.service.DocumentChunkService;
import com.aistudyhub.module.rag.dto.CitedSourceResponse;
import com.aistudyhub.module.rag.dto.RelevantChunkResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RagCoreServiceImpl Tests")
class RagCoreServiceImplTest {

    @Mock
    private DocumentChunkService documentChunkService;

    @InjectMocks
    private RagCoreServiceImpl ragCoreService;

    @Test
    @DisplayName("Should delegate document processing to document chunk service")
    void processDocument_DelegatesToDocumentChunkService() {
        DocumentProcessRequest request = new DocumentProcessRequest();
        request.setChunkSize(600);

        DocumentProcessResponse expected = DocumentProcessResponse.builder()
                .documentId(11L)
                .processingStatus("SUCCESS")
                .chunkCount(2)
                .message("Processed")
                .build();

        when(documentChunkService.processDocument(11L, 7L, request)).thenReturn(expected);

        DocumentProcessResponse actual = ragCoreService.processDocument(11L, 7L, request);

        assertThat(actual).isSameAs(expected);
        verify(documentChunkService).processDocument(11L, 7L, request);
    }

    @Test
    @DisplayName("Should map relevant chunks from notebook retrieval into shared RAG DTO")
    void findRelevantChunks_MapsToSharedContract() {
        when(documentChunkService.findRelevantChunks(9L, 3L, "SRS là gì?", 2)).thenReturn(List.of(
                chunkResponse(101L, 501L, "SRS Notes", 0, "Functional requirements and constraints", 12, "Intro"),
                chunkResponse(102L, 502L, "Use Cases", 1, "Use case describes actor interaction", 14, "Use Case")
        ));

        List<RelevantChunkResponse> actual = ragCoreService.findRelevantChunks(9L, "SRS là gì?", 2, 3L);

        assertThat(actual).hasSize(2);
        assertThat(actual.get(0).getDocumentId()).isEqualTo(501L);
        assertThat(actual.get(0).getDocumentTitle()).isEqualTo("SRS Notes");
        assertThat(actual.get(0).getSourceSection()).isEqualTo("Intro");
        assertThat(actual.get(1).getChunkIndex()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should build shared cited sources with section and excerpt")
    void buildCitedSources_UsesSharedCitationFormat() {
        List<CitedSourceResponse> citations = ragCoreService.buildCitedSources(List.of(
                RelevantChunkResponse.builder()
                        .documentId(501L)
                        .documentTitle("SRS Notes")
                        .chunkIndex(0)
                        .sourcePage(12)
                        .sourceSection("Introduction")
                        .textContent("Software requirements specification defines scope, constraints, assumptions and acceptance criteria.")
                        .build()
        ));

        assertThat(citations).hasSize(1);
        assertThat(citations.get(0).getDocumentId()).isEqualTo(501L);
        assertThat(citations.get(0).getSourcePage()).isEqualTo(12);
        assertThat(citations.get(0).getSourceSection()).isEqualTo("Introduction");
        assertThat(citations.get(0).getExcerpt()).contains("Software requirements specification");
    }

    @Test
    @DisplayName("Should build fallback mock answer from shared relevant chunks")
    void buildMockAnswer_BuildsSummaryFromSharedChunks() {
        String answer = ragCoreService.buildMockAnswer("SRS là gì?", List.of(
                RelevantChunkResponse.builder()
                        .documentTitle("SRS Notes")
                        .textContent("SRS defines functional requirements and non-functional requirements for the system.")
                        .build(),
                RelevantChunkResponse.builder()
                        .documentTitle("SRS Notes")
                        .textContent("It also records constraints and acceptance criteria used by stakeholders.")
                        .build()
        ));

        assertThat(answer).contains("SRS là gì?");
        assertThat(answer).contains("SRS Notes");
        assertThat(answer).contains("functional requirements");
    }

    @Test
    @DisplayName("Should return no-context fallback when no relevant chunks are available")
    void buildMockAnswer_ReturnsNoContextFallback() {
        String answer = ragCoreService.buildMockAnswer("DDD là gì?", List.of());

        assertThat(answer).contains("Mình chưa tìm thấy đoạn tài liệu phù hợp");
        assertThat(answer).contains("DDD là gì?");
    }

    private DocumentChunkResponse chunkResponse(
            Long id,
            Long documentId,
            String documentTitle,
            Integer chunkIndex,
            String textContent,
            Integer sourcePage,
            String sourceSection) {
        return DocumentChunkResponse.builder()
                .id(id)
                .documentId(documentId)
                .documentTitle(documentTitle)
                .chunkIndex(chunkIndex)
                .textContent(textContent)
                .tokenEstimate(40)
                .sourcePage(sourcePage)
                .sourceSection(sourceSection)
                .vectorId("vec-" + id)
                .build();
    }
}
