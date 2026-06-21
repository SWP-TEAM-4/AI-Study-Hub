package com.aistudyhub.module.document.service;

import com.aistudyhub.config.ChunkConfig;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Owner: BE1 – RAG Core
 * <p>
 * Service tách text thành danh sách chunks theo rule thống nhất.
 * <p>
 * Algorithm:
 * 1. Normalize text (remove excessive whitespace, trim lines)
 * 2. Chia theo paragraph (double newline) trước
 * 3. Nếu paragraph > chunkSize → chia theo sentence boundary
 * 4. Nếu sentence > chunkSize → chia cứng theo chunkSize với overlap
 * 5. Merge paragraphs nhỏ liền kề cho đến khi đạt chunkSize
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextChunkingService {

    private static final Pattern PAGE_MARKER = Pattern.compile("^\\[\\[PAGE:(\\d+)]]$");
    private static final Pattern SECTION_MARKER = Pattern.compile("^\\[\\[SECTION:(.+)]]$");

    private final ChunkConfig chunkConfig;

    /**
     * Result object cho mỗi chunk sau khi tách.
     */
    public record ChunkResult(
            int index,
            String content,
            Integer tokenEstimate,
            Integer sourcePage,
            String sourceSection,
            String vectorId) {
    }

    private record ParsedParagraph(String content, Integer sourcePage, String sourceSection) {
    }

    private record ChunkSeed(String content, Integer sourcePage, String sourceSection) {
    }

    /**
     * Tách raw text thành danh sách chunks.
     *
     * @param rawText text đã extract từ document
     * @return danh sách ChunkResult với index, content, và mock vectorId
     */
    public List<ChunkResult> chunkText(String rawText) {
        return chunkText(rawText, null, null);
    }

    /**
     * Tách raw text thành chunks, cho phép override chunk size / overlap từ request.
     */
    public List<ChunkResult> chunkText(String rawText, Integer requestedChunkSize, Integer requestedOverlap) {
        if (rawText == null || rawText.isBlank()) {
            return List.of();
        }

        int chunkSize = resolveChunkSize(requestedChunkSize);
        int overlap = resolveOverlap(requestedOverlap, chunkSize);
        int maxChunks = chunkConfig.getMaxChunksPerDoc();

        // 1. Normalize text
        String normalizedText = normalizeText(rawText);

        // 2. Split into paragraphs
        String[] paragraphs = normalizedText.split("\\n\\n+");

        // 3. Build chunks by merging paragraphs or splitting large ones
        List<ChunkSeed> chunkSeeds = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        Integer activeSourcePage = null;
        String activeSourceSection = null;
        Integer currentChunkSourcePage = null;
        String currentChunkSourceSection = null;

        for (String paragraph : paragraphs) {
            ParsedParagraph parsedParagraph = extractMarkers(paragraph, activeSourcePage, activeSourceSection);
            activeSourcePage = parsedParagraph.sourcePage();
            activeSourceSection = parsedParagraph.sourceSection();

            String trimmed = parsedParagraph.content().trim();
            if (trimmed.isEmpty()) continue;

            // Nếu paragraph đơn lẻ đã quá lớn → split nó
            if (trimmed.length() > chunkSize) {
                // Flush current buffer nếu có
                if (!currentChunk.isEmpty()) {
                    chunkSeeds.add(new ChunkSeed(
                            currentChunk.toString().trim(),
                            currentChunkSourcePage,
                            currentChunkSourceSection));
                    currentChunk.setLength(0);
                    currentChunkSourcePage = null;
                    currentChunkSourceSection = null;
                }
                // Split large paragraph
                chunkSeeds.addAll(splitLargeParagraph(
                        trimmed,
                        chunkSize,
                        overlap,
                        activeSourcePage,
                        activeSourceSection));
                continue;
            }

            // Nếu thêm paragraph này vào buffer mà vượt chunkSize → flush
            if (currentChunk.length() + trimmed.length() + 1 > chunkSize) {
                if (!currentChunk.isEmpty()) {
                    chunkSeeds.add(new ChunkSeed(
                            currentChunk.toString().trim(),
                            currentChunkSourcePage,
                            currentChunkSourceSection));
                    // Giữ overlap bằng cách lấy phần cuối của chunk trước
                    String overlapText = getOverlapText(currentChunk.toString(), overlap);
                    currentChunk.setLength(0);
                    if (!overlapText.isEmpty()) {
                        currentChunk.append(overlapText).append("\n");
                    }
                    currentChunkSourcePage = activeSourcePage;
                    currentChunkSourceSection = activeSourceSection;
                }
            }

            // Thêm paragraph vào buffer
            if (currentChunk.isEmpty()) {
                currentChunkSourcePage = activeSourcePage;
                currentChunkSourceSection = activeSourceSection;
            }
            if (!currentChunk.isEmpty()) {
                currentChunk.append("\n");
            }
            currentChunk.append(trimmed);
        }

        // Flush remaining buffer
        if (!currentChunk.isEmpty()) {
            chunkSeeds.add(new ChunkSeed(
                    currentChunk.toString().trim(),
                    currentChunkSourcePage,
                    currentChunkSourceSection));
        }

        // 4. Safety limit
        if (chunkSeeds.size() > maxChunks) {
            log.warn("Document produces {} chunks, exceeding max {}", chunkSeeds.size(), maxChunks);
            throw new AppException(ErrorCode.TOO_MANY_CHUNKS,
                    "Document produces " + chunkSeeds.size() + " chunks, exceeding limit " + maxChunks);
        }

        // 5. Build results with index and mock vectorId
        List<ChunkResult> results = new ArrayList<>();
        for (int i = 0; i < chunkSeeds.size(); i++) {
            ChunkSeed chunkSeed = chunkSeeds.get(i);
            results.add(new ChunkResult(
                    i,
                    chunkSeed.content(),
                    estimateTokens(chunkSeed.content()),
                    chunkSeed.sourcePage(),
                    chunkSeed.sourceSection(),
                    "mock_vec_" + UUID.randomUUID()
            ));
        }

        log.info("Split text ({} chars) into {} chunks (chunkSize={}, overlap={})",
                normalizedText.length(), results.size(), chunkSize, overlap);

        return results;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Normalize text: remove control chars, collapse whitespace, trim lines.
     */
    private String normalizeText(String text) {
        return text
                // Remove null/control characters (except newline/tab)
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "")
                // Normalize line endings
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\r", "\n")
                // Collapse 3+ consecutive newlines into 2
                .replaceAll("\\n{3,}", "\n\n")
                // Trim trailing whitespace on each line
                .replaceAll("[ \\t]+\\n", "\n")
                .trim();
    }

    /**
     * Split a large paragraph by sentence boundaries.
     * Nếu sentence vẫn quá lớn → split cứng theo chunkSize.
     */
    private List<ChunkSeed> splitLargeParagraph(
            String paragraph,
            int chunkSize,
            int overlap,
            Integer sourcePage,
            String sourceSection) {
        List<ChunkSeed> chunks = new ArrayList<>();

        // Try splitting by sentences first (., !, ?)
        String[] sentences = paragraph.split("(?<=[.!?])\\s+");

        StringBuilder currentChunk = new StringBuilder();
        for (String sentence : sentences) {
            if (sentence.length() > chunkSize) {
                // Flush current
                if (!currentChunk.isEmpty()) {
                    chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
                    currentChunk.setLength(0);
                }
                // Hard split the oversized sentence
                chunks.addAll(hardSplit(sentence, chunkSize, overlap, sourcePage, sourceSection));
                continue;
            }

            if (currentChunk.length() + sentence.length() + 1 > chunkSize) {
                chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
                String overlapText = getOverlapText(currentChunk.toString(), overlap);
                currentChunk.setLength(0);
                if (!overlapText.isEmpty()) {
                    currentChunk.append(overlapText).append(" ");
                }
            }

            if (!currentChunk.isEmpty()) {
                currentChunk.append(" ");
            }
            currentChunk.append(sentence);
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
        }

        return chunks;
    }

    /**
     * Hard split text into fixed-size chunks with overlap.
     */
    private List<ChunkSeed> hardSplit(
            String text,
            int chunkSize,
            int overlap,
            Integer sourcePage,
            String sourceSection) {
        List<ChunkSeed> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            chunks.add(new ChunkSeed(text.substring(start, end).trim(), sourcePage, sourceSection));
            int step = Math.max(1, chunkSize - overlap);
            start += step;
            if (start >= text.length()) break;
        }
        return chunks;
    }

    /**
     * Get the last N characters of a text as overlap for the next chunk.
     */
    private String getOverlapText(String text, int overlapSize) {
        if (text.length() <= overlapSize) return "";
        return text.substring(text.length() - overlapSize).trim();
    }

    private int resolveChunkSize(Integer requestedChunkSize) {
        if (requestedChunkSize == null || requestedChunkSize < 50) {
            return chunkConfig.getChunkSize();
        }
        return requestedChunkSize;
    }

    private int resolveOverlap(Integer requestedOverlap, int chunkSize) {
        int fallbackOverlap = Math.min(chunkConfig.getOverlap(), Math.max(0, chunkSize - 1));
        if (requestedOverlap == null || requestedOverlap < 0) {
            return fallbackOverlap;
        }
        return Math.min(requestedOverlap, Math.max(0, chunkSize - 1));
    }

    private int estimateTokens(String content) {
        if (content == null || content.isBlank()) {
            return 0;
        }
        return Math.max(1, (int) Math.ceil(content.length() / 4.0));
    }

    private ParsedParagraph extractMarkers(String paragraph, Integer fallbackPage, String fallbackSection) {
        Integer sourcePage = fallbackPage;
        String sourceSection = fallbackSection;
        StringBuilder cleaned = new StringBuilder();

        for (String line : paragraph.split("\\n")) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) {
                continue;
            }

            Matcher pageMatcher = PAGE_MARKER.matcher(trimmedLine);
            if (pageMatcher.matches()) {
                sourcePage = Integer.parseInt(pageMatcher.group(1));
                continue;
            }

            Matcher sectionMatcher = SECTION_MARKER.matcher(trimmedLine);
            if (sectionMatcher.matches()) {
                sourceSection = sectionMatcher.group(1).trim();
                continue;
            }

            if (!cleaned.isEmpty()) {
                cleaned.append("\n");
            }
            cleaned.append(trimmedLine);
        }

        return new ParsedParagraph(cleaned.toString(), sourcePage, sourceSection);
    }
}
