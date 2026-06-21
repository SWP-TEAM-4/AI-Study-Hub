package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Service for extracting text content from various document formats.
 * <p>
 * Owner: BE1 – RAG Core (BE-016 Phase 2)
 * <p>
 * Supports:
 * - PDF: Apache PDFBox
 * - DOCX: Apache POI XWPFDocument
 * - PPTX: Apache POI XMLSlideShow
 * - TXT: Direct UTF-8 reading
 * <p>
 * Text is normalized (whitespace cleanup, control character removal)
 * before being returned for chunking.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextExtractionService {

    private final StorageService storageService;

    /**
     * Extract text content from a document.
     * <p>
     * Process:
     * 1. Download file from storage using cloudFilePath
     * 2. Detect file type from document.fileType
     * 3. Extract text using appropriate library
     * 4. Normalize text (remove excessive whitespace, control chars)
     * 5. Validate non-empty content
     *
     * @param document Document entity with cloudFilePath and fileType
     * @return Normalized text content
     * @throws AppException TEXT_EXTRACTION_FAILED if extraction fails
     * @throws AppException DOCUMENT_EMPTY_CONTENT if extracted text is empty
     */
    public String extractText(Document document) {
        log.info("Extracting text from document: id={}, type={}, path={}",
                document.getId(), document.getFileType(), document.getCloudFilePath());

        try {
            // 1. Download file content
            byte[] fileContent = storageService.readFileContent(document.getCloudFilePath());
            if (fileContent == null || fileContent.length == 0) {
                throw new AppException(ErrorCode.TEXT_EXTRACTION_FAILED,
                        "Failed to download file from storage");
            }

            // 2. Extract based on file type
            String rawText;
            try (InputStream inputStream = new ByteArrayInputStream(fileContent)) {
                rawText = switch (document.getFileType().toUpperCase()) {
                    case "PDF" -> extractFromPdf(inputStream);
                    case "DOCX" -> extractFromDocx(inputStream);
                    case "PPTX" -> extractFromPptx(inputStream);
                    case "TXT" -> extractFromTxt(inputStream);
                    default -> throw new AppException(ErrorCode.INVALID_FILE_TYPE,
                            "Unsupported file type for extraction: " + document.getFileType());
                };
            }

            // 3. Normalize text
            String normalizedText = normalizeText(rawText);

            // 4. Validate non-empty
            if (normalizedText.isEmpty()) {
                throw new AppException(ErrorCode.DOCUMENT_EMPTY_CONTENT,
                        "Document contains no extractable text");
            }

            log.info("Text extraction successful: documentId={}, length={} chars",
                    document.getId(), normalizedText.length());

            return normalizedText;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Text extraction failed for document {}: {}", document.getId(), e.getMessage(), e);
            throw new AppException(ErrorCode.TEXT_EXTRACTION_FAILED,
                    "Failed to extract text: " + e.getMessage());
        }
    }

    /**
     * Extract text from PDF file using Apache PDFBox.
     */
    private String extractFromPdf(InputStream inputStream) throws IOException {
        log.debug("Extracting text from PDF");

        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            StringBuilder text = new StringBuilder();

            for (int pageNumber = 1; pageNumber <= document.getNumberOfPages(); pageNumber++) {
                stripper.setStartPage(pageNumber);
                stripper.setEndPage(pageNumber);

                String pageText = stripper.getText(document).trim();
                if (pageText.isEmpty()) {
                    continue;
                }

                if (!text.isEmpty()) {
                    text.append("\n\n");
                }
                text.append("[[PAGE:").append(pageNumber).append("]]\n");
                text.append(pageText);
            }

            log.debug("PDF extraction complete: {} pages, {} chars",
                    document.getNumberOfPages(), text.length());

            return text.toString();
        }
    }

    /**
     * Extract text from DOCX file using Apache POI.
     * Extracts text from paragraphs and tables.
     */
    private String extractFromDocx(InputStream inputStream) throws IOException {
        log.debug("Extracting text from DOCX");

        StringBuilder text = new StringBuilder();

        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            // Extract from paragraphs
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String paragraphText = paragraph.getText();
                if (paragraphText != null && !paragraphText.trim().isEmpty()) {
                    text.append(paragraphText).append("\n");
                }
            }

            // Extract from tables
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.trim().isEmpty()) {
                            text.append(cellText).append(" ");
                        }
                    }
                    text.append("\n");
                }
            }

            log.debug("DOCX extraction complete: {} chars", text.length());
            return text.toString();
        }
    }

    /**
     * Extract text from PPTX file using Apache POI.
     * Extracts text from all text shapes in all slides.
     */
    private String extractFromPptx(InputStream inputStream) throws IOException {
        log.debug("Extracting text from PPTX");

        StringBuilder text = new StringBuilder();

        try (XMLSlideShow slideShow = new XMLSlideShow(inputStream)) {
            int slideNumber = 1;
            for (XSLFSlide slide : slideShow.getSlides()) {
                StringBuilder slideText = new StringBuilder();
                // Extract text from all shapes in the slide
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape) {
                        XSLFTextShape textShape = (XSLFTextShape) shape;
                        String shapeText = textShape.getText();
                        if (shapeText != null && !shapeText.trim().isEmpty()) {
                            if (!slideText.isEmpty()) {
                                slideText.append("\n");
                            }
                            slideText.append(shapeText.trim());
                        }
                    }
                }
                if (!slideText.isEmpty()) {
                    if (!text.isEmpty()) {
                        text.append("\n\n");
                    }
                    text.append("[[PAGE:").append(slideNumber).append("]]\n");
                    text.append("[[SECTION:Slide ").append(slideNumber).append("]]\n");
                    text.append(slideText);
                }
                slideNumber++;
            }

            log.debug("PPTX extraction complete: {} slides, {} chars",
                    slideShow.getSlides().size(), text.length());

            return text.toString();
        }
    }

    /**
     * Extract text from TXT file.
     * Simply reads the file as UTF-8 text.
     */
    private String extractFromTxt(InputStream inputStream) throws IOException {
        log.debug("Extracting text from TXT");

        String text = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        
        log.debug("TXT extraction complete: {} chars", text.length());
        
        return text;
    }

    /**
     * Normalize extracted text:
     * - Replace multiple consecutive spaces with single space
     * - Replace multiple consecutive newlines with double newline (paragraph separation)
     * - Remove control characters (except newline and tab)
     * - Trim leading/trailing whitespace from each line
     * - Remove completely empty lines
     */
    private String normalizeText(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        // Remove control characters except \n and \t
        text = text.replaceAll("[\\p{Cntrl}&&[^\n\t]]", "");

        // Replace multiple spaces with single space
        text = text.replaceAll(" +", " ");

        // Replace multiple tabs with single space
        text = text.replaceAll("\t+", " ");

        // Trim each line and remove completely empty lines
        String[] lines = text.split("\n");
        StringBuilder normalized = new StringBuilder();
        
        for (String line : lines) {
            String trimmedLine = line.trim();
            if (!trimmedLine.isEmpty()) {
                normalized.append(trimmedLine).append("\n");
            }
        }

        // Replace 3+ consecutive newlines with just 2 (paragraph break)
        String result = normalized.toString().replaceAll("\n{3,}", "\n\n");

        // Final trim
        return result.trim();
    }
}
