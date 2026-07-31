package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.DocumentModerationStatus;
import com.aistudyhub.common.enums.DocumentViolationSeverity;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.enums.AiActionType;
import com.aistudyhub.entity.AiUsageLogs;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.DocumentShareLink;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.AiUsageLogsRepository;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentShareLinkRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.module.document.service.GeminiChunkingService;
import com.aistudyhub.module.document.service.OpenAIEmbeddingService;
import com.aistudyhub.module.document.service.StorageService;
import com.aistudyhub.module.document.service.TextChunkingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE056Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private DocumentShareLinkRepository documentShareLinkRepository;

    @Autowired
    private AiUsageLogsRepository aiUsageLogsRepository;

    @MockBean
    private StorageService storageService;

    @MockBean
    private GeminiChunkingService geminiChunkingService;

    @MockBean
    private OpenAIEmbeddingService openAIEmbeddingService;

    private User owner;
    private User otherUser;
    private User admin;
    private Subject subject;
    private Document privateDocument;
    private Document marketplaceDocument;

    @BeforeEach
    void setUp() {
        aiUsageLogsRepository.deleteAll();
        documentShareLinkRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(User.builder()
                .email("owner-be056@aistudyhub.com")
                .fullName("Owner User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other-be056@aistudyhub.com")
                .fullName("Other User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        admin = userRepository.save(User.builder()
                .email("admin-be056@aistudyhub.com")
                .fullName("Admin User")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        subject = subjectRepository.save(Subject.builder()
                .code("SWR391")
                .name("Software Engineering")
                .standardSemesterNumber(6)
                .build());

        privateDocument = documentRepository.save(Document.builder()
                .user(owner)
                .subject(subject)
                .title("Owner Notes")
                .description("Private owner document")
                .fileType("pdf")
                .fileSize(2048L)
                .cloudFilePath("documents/owner-notes.pdf")
                .processingStatus(ProcessingStatus.SUCCESS)
                .moderationStatus(DocumentModerationStatus.SAFE)
                .violationSeverity(DocumentViolationSeverity.NONE)
                .visibility(Visibility.PRIVATE)
                .marketStatus(MarketStatus.NONE)
                .downloadCount(0)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        marketplaceDocument = documentRepository.save(Document.builder()
                .user(owner)
                .subject(subject)
                .title("Marketplace Notes")
                .description("Published marketplace document")
                .fileType("pdf")
                .fileSize(4096L)
                .cloudFilePath("documents/marketplace-notes.pdf")
                .processingStatus(ProcessingStatus.SUCCESS)
                .moderationStatus(DocumentModerationStatus.SAFE)
                .violationSeverity(DocumentViolationSeverity.NONE)
                .visibility(Visibility.MARKETPLACE)
                .marketStatus(MarketStatus.APPROVED)
                .downloadCount(7)
                .reviewCount(2)
                .acceptPercentage(BigDecimal.valueOf(90))
                .build());

        documentChunkRepository.save(DocumentChunk.builder()
                .document(privateDocument)
                .chunkIndex(0)
                .textContent("Software requirements specification describes system behavior and constraints.")
                .tokenEstimate(42)
                .sourcePage(12)
                .sourceSection("Section 1")
                .build());
    }

    @Test
    void processDocumentLogsGeminiChunkingAndOpenAiEmbeddingUsage() throws Exception {
        String rawText = "Software requirements introduce actors, functional flows, constraints, and acceptance criteria.";
        String firstChunk = "Software requirements introduce actors and functional flows.";
        String secondChunk = "Constraints and acceptance criteria guide validation.";
        List<TextChunkingService.ChunkResult> chunkResults = List.of(
                new TextChunkingService.ChunkResult(0, firstChunk, 14, 1, "Introduction", null),
                new TextChunkingService.ChunkResult(1, secondChunk, 12, 2, "Validation", null)
        );

        when(geminiChunkingService.chunkTextWithSafetyReview(eq(rawText), eq(800), eq(120)))
                .thenReturn(new GeminiChunkingService.ModeratedChunkingOutcome(
                        chunkResults,
                        GeminiChunkingService.ChunkingStrategy.GEMINI_SEMANTIC,
                        "Gemini safety review and semantic chunking completed successfully",
                        new GeminiChunkingService.SafetyReview(
                                true,
                                DocumentViolationSeverity.NONE,
                                "NONE",
                                0.01,
                                "Safe educational software engineering notes.",
                                List.of())));
        when(openAIEmbeddingService.generateBatchEmbeddings(eq(privateDocument.getId()),
                eq(List.of(firstChunk, secondChunk))))
                .thenReturn(Map.of(
                        0, new OpenAIEmbeddingService.EmbeddingResult(
                                "openai:test:0", "[0.1,0.2,0.3]", "text-embedding-3-small"),
                        1, new OpenAIEmbeddingService.EmbeddingResult(
                                "openai:test:1", "[0.2,0.3,0.4]", "text-embedding-3-small")
                ));

        mockMvc.perform(post("/api/documents/{documentId}/process", privateDocument.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "chunkSize", 800,
                                "overlap", 120,
                                "mockText", rawText))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.processingStatus").value("SUCCESS"))
                .andExpect(jsonPath("$.data.chunkCount").value(2));

        Map<AiActionType, Long> counts = aiUsageLogsRepository.findByUser_IdOrderByCreatedAtDesc(owner.getId())
                .stream()
                .peek(log -> assertTrue(log.getTokenCount() > 0))
                .collect(Collectors.groupingBy(AiUsageLogs::getActionType, Collectors.counting()));

        assertEquals(1L, counts.get(AiActionType.DOCUMENT_CHUNKING));
        assertEquals(1L, counts.get(AiActionType.DOCUMENT_EMBEDDING));

        mockMvc.perform(get("/api/users/me/ai-usage")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRequests").value(2))
                .andExpect(jsonPath("$.data.documentChunkingRequests").value(1))
                .andExpect(jsonPath("$.data.documentEmbeddingRequests").value(1))
                .andExpect(jsonPath("$.data.actionCounts.DOCUMENT_CHUNKING").value(1))
                .andExpect(jsonPath("$.data.actionCounts.DOCUMENT_EMBEDDING").value(1));
    }

    @Test
    void ownerCanUpdateDocumentChunkTextAndEmbedding() throws Exception {
        DocumentChunk chunk = documentChunkRepository
                .findByDocumentIdOrderByChunkIndexAsc(privateDocument.getId())
                .get(0);
        String editedText = "Updated SRS chunk with corrected actors, constraints, and acceptance criteria.";

        when(openAIEmbeddingService.generateChunkEmbedding(
                eq(privateDocument.getId()),
                eq(chunk.getChunkIndex()),
                eq(editedText)))
                .thenReturn(new OpenAIEmbeddingService.EmbeddingResult(
                        "openai:test:" + chunk.getChunkIndex(),
                        "[0.7,0.8,0.9]",
                        "text-embedding-3-small"));

        mockMvc.perform(patch("/api/documents/{documentId}/chunks/{chunkId}",
                        privateDocument.getId(), chunk.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("textContent", editedText))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.textContent").value(editedText))
                .andExpect(jsonPath("$.data.vectorId").value("openai:test:" + chunk.getChunkIndex()));

        DocumentChunk reloaded = documentChunkRepository.findById(chunk.getId()).orElseThrow();
        assertEquals(editedText, reloaded.getTextContent());
        assertTrue(reloaded.getTokenEstimate() > 0);
        assertEquals("[0.7,0.8,0.9]", reloaded.getEmbeddingVector());
        assertEquals("text-embedding-3-small", reloaded.getEmbeddingModel());
        assertEquals(1, aiUsageLogsRepository.findByUser_IdOrderByCreatedAtDesc(owner.getId()).size());
    }

    @Test
    void otherUserCannotUpdateForeignDocumentChunk() throws Exception {
        DocumentChunk chunk = documentChunkRepository
                .findByDocumentIdOrderByChunkIndexAsc(privateDocument.getId())
                .get(0);

        mockMvc.perform(patch("/api/documents/{documentId}/chunks/{chunkId}",
                        privateDocument.getId(), chunk.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(otherUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("textContent", "Trying to edit"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_ACCESS_DENIED"));
    }

    @Test
    void ownerCanCreateShareLink_AndDocumentBecomesPublicLink() throws Exception {
        JsonNode response = createShareLink(privateDocument.getId(), owner, """
                {
                  "allowPreview": true,
                  "allowDownload": true,
                  "expiresAt": "%s"
                }
                """.formatted(LocalDateTime.now().plusDays(3)));

        assertNotNull(response.path("data").path("shareToken").asText(null));
        assertEquals("PUBLIC_LINK", response.path("data").path("documentVisibility").asText());

        Document reloaded = documentRepository.findById(privateDocument.getId()).orElseThrow();
        assertEquals(Visibility.PUBLIC_LINK, reloaded.getVisibility());
        assertTrue(documentShareLinkRepository.findByDocumentId(privateDocument.getId()).isPresent());
    }

    @Test
    void otherUserCannotCreateShareLinkForForeignDocument() throws Exception {
        mockMvc.perform(post("/api/documents/{documentId}/share-link", privateDocument.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(otherUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "allowPreview": true,
                                  "allowDownload": true
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_ACCESS_DENIED"));
    }

    @Test
    void adminCanManageShareLinkForAnotherUsersDocument() throws Exception {
        JsonNode created = createShareLink(privateDocument.getId(), owner, """
                {
                  "allowPreview": true,
                  "allowDownload": true
                }
                """);
        assertTrue(created.path("data").path("isEnabled").asBoolean());

        mockMvc.perform(patch("/api/documents/{documentId}/share-link", privateDocument.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isEnabled": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isEnabled").value(false))
                .andExpect(jsonPath("$.data.documentVisibility").value("PRIVATE"));
    }

    @Test
    void publicPreviewReturnsSafeMetadata_AndIncrementsAccessCount() throws Exception {
        DocumentShareLink shareLink = saveShareLink(privateDocument, "public-preview-token",
                true, true, LocalDateTime.now().plusDays(2));

        MvcResult result = mockMvc.perform(get("/api/share/documents/{shareToken}", shareLink.getShareToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Owner Notes"))
                .andExpect(jsonPath("$.data.previewText").value(
                        "Software requirements specification describes system behavior and constraints."))
                .andExpect(jsonPath("$.data.downloadUrl").value("/api/share/documents/public-preview-token/download"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("cloudFilePath"));
        assertFalse(body.contains("documents/owner-notes.pdf"));

        DocumentShareLink reloaded = documentShareLinkRepository.findById(shareLink.getId()).orElseThrow();
        assertEquals(1, reloaded.getAccessCount());
        assertNotNull(reloaded.getLastAccessedAt());
    }

    @Test
    void publicDownloadReturnsFile_AndIncrementsCounters() throws Exception {
        DocumentShareLink shareLink = saveShareLink(privateDocument, "download-token",
                true, true, LocalDateTime.now().plusDays(2));

        when(storageService.readFileContent(eq(privateDocument.getCloudFilePath())))
                .thenReturn("pdf-bytes".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(get("/api/share/documents/{shareToken}/download", shareLink.getShareToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("filename=\"Owner Notes.pdf\"")))
                .andExpect(content().bytes("pdf-bytes".getBytes(StandardCharsets.UTF_8)));

        DocumentShareLink reloadedLink = documentShareLinkRepository.findById(shareLink.getId()).orElseThrow();
        Document reloadedDocument = documentRepository.findById(privateDocument.getId()).orElseThrow();
        assertEquals(1, reloadedLink.getAccessCount());
        assertEquals(1, reloadedDocument.getDownloadCount());
    }

    @Test
    void publicDownloadIsBlockedWhenDownloadNotAllowed() throws Exception {
        DocumentShareLink shareLink = saveShareLink(privateDocument, "download-blocked-token",
                true, false, LocalDateTime.now().plusDays(2));

        mockMvc.perform(get("/api/share/documents/{shareToken}/download", shareLink.getShareToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("DOWNLOAD_NOT_ALLOWED"));
    }

    @Test
    void publicPreviewIsBlockedWhenShareLinkExpired() throws Exception {
        DocumentShareLink shareLink = saveShareLink(privateDocument, "expired-token",
                true, true, LocalDateTime.now().plusHours(1));
        shareLink.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        documentShareLinkRepository.save(shareLink);

        mockMvc.perform(get("/api/share/documents/{shareToken}", shareLink.getShareToken()))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.errorCode").value("DOCUMENT_SHARE_LINK_EXPIRED"));
    }

    @Test
    void deleteShareLinkRevertsPrivateDocumentVisibility() throws Exception {
        createShareLink(privateDocument.getId(), owner, """
                {
                  "allowPreview": true,
                  "allowDownload": true
                }
                """);

        mockMvc.perform(delete("/api/documents/{documentId}/share-link", privateDocument.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deleted").value(true))
                .andExpect(jsonPath("$.data.documentVisibility").value("PRIVATE"));

        Document reloaded = documentRepository.findById(privateDocument.getId()).orElseThrow();
        assertEquals(Visibility.PRIVATE, reloaded.getVisibility());
        assertTrue(documentShareLinkRepository.findByDocumentId(privateDocument.getId()).isEmpty());
    }

    @Test
    void deleteShareLinkKeepsMarketplaceVisibilityForPublishedDocument() throws Exception {
        createShareLink(marketplaceDocument.getId(), owner, """
                {
                  "allowPreview": true,
                  "allowDownload": true
                }
                """);

        mockMvc.perform(delete("/api/documents/{documentId}/share-link", marketplaceDocument.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(owner))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentVisibility").value("MARKETPLACE"));

        Document reloaded = documentRepository.findById(marketplaceDocument.getId()).orElseThrow();
        assertEquals(Visibility.MARKETPLACE, reloaded.getVisibility());
    }

    private JsonNode createShareLink(Long documentId, User user, String requestBody) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/documents/{documentId}/share-link", documentId)
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(user)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private DocumentShareLink saveShareLink(Document document, String token,
                                            boolean allowPreview, boolean allowDownload,
                                            LocalDateTime expiresAt) {
        document.setVisibility(Visibility.PUBLIC_LINK);
        documentRepository.save(document);

        return documentShareLinkRepository.save(DocumentShareLink.builder()
                .document(document)
                .ownerUser(document.getUser())
                .shareToken(token)
                .allowPreview(allowPreview)
                .allowDownload(allowDownload)
                .expiresAt(expiresAt)
                .accessCount(0)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
