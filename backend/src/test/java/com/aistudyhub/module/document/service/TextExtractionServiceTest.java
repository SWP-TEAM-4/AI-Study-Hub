package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TextExtractionService.
 * <p>
 * Owner: BE1 – RAG Core (BE-016 Phase 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TextExtractionService Tests")
class TextExtractionServiceTest {

    @Mock
    private StorageService storageService;

    @InjectMocks
    private TextExtractionService textExtractionService;

    private Document testDocument;

    @BeforeEach
    void setUp() {
        testDocument = Document.builder()
                .id(1L)
                .cloudFilePath("test/document.txt")
                .fileType("TXT")
                .build();
    }

    @Test
    @DisplayName("Should extract text from TXT file successfully")
    void extractText_FromTxt_Success() {
        // Given
        String sampleText = "This is a sample text document.\nWith multiple lines.\nAnd some content.";
        byte[] fileContent = sampleText.getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When
        String extractedText = textExtractionService.extractText(testDocument);

        // Then
        assertThat(extractedText).isNotEmpty();
        assertThat(extractedText).contains("sample text document");
        assertThat(extractedText).contains("multiple lines");
        verify(storageService, times(1)).readFileContent(testDocument.getCloudFilePath());
    }

    @Test
    @DisplayName("Should normalize text by removing excessive whitespace")
    void extractText_NormalizesWhitespace() {
        // Given
        String textWithExtraSpaces = "This  has   multiple    spaces.\n\n\n\nAnd many newlines.";
        byte[] fileContent = textWithExtraSpaces.getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When
        String extractedText = textExtractionService.extractText(testDocument);

        // Then
        assertThat(extractedText).doesNotContain("  "); // No double spaces
        assertThat(extractedText).doesNotContain("\n\n\n"); // Max 2 consecutive newlines
    }

    @Test
    @DisplayName("Should throw exception when file content is null")
    void extractText_FileContentNull_ThrowsException() {
        // Given
        when(storageService.readFileContent(anyString())).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should throw exception when file content is empty")
    void extractText_FileContentEmpty_ThrowsException() {
        // Given
        when(storageService.readFileContent(anyString())).thenReturn(new byte[0]);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should throw exception when extracted text is empty after normalization")
    void extractText_ExtractedTextEmpty_ThrowsException() {
        // Given
        String emptyText = "   \n\n\t\t   \n   "; // Only whitespace
        byte[] fileContent = emptyText.getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DOCUMENT_EMPTY_CONTENT);
    }

    @Test
    @DisplayName("Should throw exception for unsupported file type")
    void extractText_UnsupportedFileType_ThrowsException() {
        // Given
        testDocument.setFileType("XYZ");
        byte[] fileContent = "test".getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_FILE_TYPE);
    }

    @Test
    @DisplayName("Should handle PDF file type")
    void extractText_PdfFileType_CallsPdfExtraction() {
        // Given
        testDocument.setFileType("PDF");
        // Note: This would require a real PDF file or mocking PDFBox
        // For now, we expect TEXT_EXTRACTION_FAILED due to invalid PDF content
        byte[] invalidPdfContent = "not a real pdf".getBytes();
        
        when(storageService.readFileContent(anyString())).thenReturn(invalidPdfContent);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should handle DOCX file type")
    void extractText_DocxFileType_CallsDocxExtraction() {
        // Given
        testDocument.setFileType("DOCX");
        // Note: This would require a real DOCX file or mocking Apache POI
        byte[] invalidDocxContent = "not a real docx".getBytes();
        
        when(storageService.readFileContent(anyString())).thenReturn(invalidDocxContent);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should handle PPTX file type")
    void extractText_PptxFileType_CallsPptxExtraction() {
        // Given
        testDocument.setFileType("PPTX");
        // Note: This would require a real PPTX file or mocking Apache POI
        byte[] invalidPptxContent = "not a real pptx".getBytes();
        
        when(storageService.readFileContent(anyString())).thenReturn(invalidPptxContent);

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should handle storage service exception")
    void extractText_StorageServiceThrowsException_PropagatesAsExtractionFailed() {
        // Given
        when(storageService.readFileContent(anyString()))
                .thenThrow(new RuntimeException("Storage error"));

        // When & Then
        assertThatThrownBy(() -> textExtractionService.extractText(testDocument))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TEXT_EXTRACTION_FAILED);
    }

    @Test
    @DisplayName("Should remove control characters from text")
    void extractText_RemovesControlCharacters() {
        // Given
        String textWithControlChars = "Normal text\u0000with\u0001null\u0002chars";
        byte[] fileContent = textWithControlChars.getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When
        String extractedText = textExtractionService.extractText(testDocument);

        // Then
        assertThat(extractedText).doesNotContain("\u0000");
        assertThat(extractedText).doesNotContain("\u0001");
        assertThat(extractedText).doesNotContain("\u0002");
        assertThat(extractedText).contains("Normal text");
    }

    @Test
    @DisplayName("Should preserve newlines and paragraph structure")
    void extractText_PreservesNewlines() {
        // Given
        String textWithParagraphs = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
        byte[] fileContent = textWithParagraphs.getBytes(StandardCharsets.UTF_8);
        
        when(storageService.readFileContent(anyString())).thenReturn(fileContent);

        // When
        String extractedText = textExtractionService.extractText(testDocument);

        // Then
        assertThat(extractedText).contains("First paragraph");
        assertThat(extractedText).contains("Second paragraph");
        assertThat(extractedText).contains("Third paragraph");
        // Should have newlines but not excessive ones
        assertThat(extractedText.split("\n").length).isGreaterThan(1);
    }
}
