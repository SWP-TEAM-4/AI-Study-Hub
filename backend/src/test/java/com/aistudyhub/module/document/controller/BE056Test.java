package com.aistudyhub.module.document.controller;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentChunk;
import com.aistudyhub.entity.DocumentShareLink;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.DocumentChunkRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentShareLinkRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.module.document.service.StorageService;
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

    @MockBean
    private StorageService storageService;

    private User owner;
    private User otherUser;
    private User admin;
    private Subject subject;
    private Document privateDocument;
    private Document marketplaceDocument;

    @BeforeEach
    void setUp() {
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
