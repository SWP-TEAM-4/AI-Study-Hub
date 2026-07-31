package com.aistudyhub.module.document.service;

import com.aistudyhub.config.ChunkConfig;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
 * 4. Nếu sentence > chunkSize → chia theo cuối câu/khoảng trắng trước khi buộc cắt cứng
 * 5. Merge paragraphs nhỏ liền kề cho đến khi đạt chunkSize
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TextChunkingService {

    private static final Pattern PAGE_MARKER = Pattern.compile("^\\[\\[PAGE:(\\d+)]]$");
    private static final Pattern SECTION_MARKER = Pattern.compile("^\\[\\[SECTION:(.+)]]$");
    private static final Locale SENTENCE_LOCALE = Locale.forLanguageTag("vi-VN");
    private static final String SENTENCE_TERMINATORS = ".!?…。！？";
    private static final double MIN_SPLIT_RATIO = 0.55;

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
                    if (!overlapText.isEmpty() && overlapText.length() + trimmed.length() + 1 <= chunkSize) {
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
     * Nếu sentence vẫn quá lớn → split theo cuối câu/khoảng trắng trước khi buộc cắt cứng.
     */
    private List<ChunkSeed> splitLargeParagraph(
            String paragraph,
            int chunkSize,
            int overlap,
            Integer sourcePage,
            String sourceSection) {
        List<ChunkSeed> chunks = new ArrayList<>();

        List<String> sentences = splitSentences(paragraph);

        StringBuilder currentChunk = new StringBuilder();
        for (String sentence : sentences) {
            String trimmedSentence = sentence.trim();
            if (trimmedSentence.isEmpty()) {
                continue;
            }

            if (trimmedSentence.length() > chunkSize) {
                // Flush current
                if (!currentChunk.isEmpty()) {
                    chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
                    currentChunk.setLength(0);
                }
                chunks.addAll(hardSplit(trimmedSentence, chunkSize, overlap, sourcePage, sourceSection));
                continue;
            }

            if (!currentChunk.isEmpty() && currentChunk.length() + trimmedSentence.length() + 1 > chunkSize) {
                chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
                String overlapText = getOverlapText(currentChunk.toString(), overlap);
                currentChunk.setLength(0);
                if (!overlapText.isEmpty() && overlapText.length() + trimmedSentence.length() + 1 <= chunkSize) {
                    currentChunk.append(overlapText).append(" ");
                }
            }

            if (!currentChunk.isEmpty()) {
                currentChunk.append(" ");
            }
            currentChunk.append(trimmedSentence);
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(new ChunkSeed(currentChunk.toString().trim(), sourcePage, sourceSection));
        }

        return chunks;
    }

    /**
     * Split oversized text into bounded chunks with overlap.
     * Ưu tiên điểm cắt tự nhiên: cuối câu → xuống dòng → khoảng trắng.
     * Chỉ cắt theo index khi một token dài hơn chunkSize và không có boundary an toàn.
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
            start = skipLeadingWhitespace(text, start);
            if (start >= text.length()) {
                break;
            }

            int maxEnd = Math.min(start + chunkSize, text.length());
            int end = findBestSplitEnd(text, start, maxEnd, chunkSize);
            if (end <= start) {
                end = maxEnd;
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isEmpty()) {
                chunks.add(new ChunkSeed(chunk, sourcePage, sourceSection));
            }

            if (end >= text.length()) {
                break;
            }

            int nextStart = resolveNextStartWithOverlap(text, start, end, overlap);
            start = nextStart > start ? nextStart : skipLeadingWhitespace(text, end);
        }
        return chunks;
    }

    /**
     * Get the last N characters of a text as overlap for the next chunk.
     */
    private String getOverlapText(String text, int overlapSize) {
        if (overlapSize <= 0 || text == null) return "";

        String normalized = text.trim();
        if (normalized.length() <= overlapSize) return "";

        List<String> sentences = splitSentences(normalized);
        StringBuilder overlap = new StringBuilder();
        for (int i = sentences.size() - 1; i >= 0; i--) {
            String sentence = sentences.get(i).trim();
            if (sentence.isEmpty()) {
                continue;
            }

            int candidateLength = overlap.isEmpty()
                    ? sentence.length()
                    : sentence.length() + 1 + overlap.length();
            if (candidateLength > overlapSize) {
                break;
            }

            if (!overlap.isEmpty()) {
                overlap.insert(0, " ");
            }
            overlap.insert(0, sentence);
        }

        if (!overlap.isEmpty()) {
            return overlap.toString().trim();
        }

        int start = findTailWordBoundaryStart(normalized, overlapSize);
        return start < normalized.length() ? normalized.substring(start).trim() : "";
    }

    private List<String> splitSentences(String text) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.isEmpty()) {
            return List.of();
        }

        BreakIterator iterator = BreakIterator.getSentenceInstance(SENTENCE_LOCALE);
        iterator.setText(normalized);

        List<String> sentences = new ArrayList<>();
        int start = iterator.first();
        for (int end = iterator.next(); end != BreakIterator.DONE; start = end, end = iterator.next()) {
            String sentence = normalized.substring(start, end).trim();
            if (!sentence.isEmpty()) {
                sentences.add(sentence);
            }
        }

        return sentences.isEmpty() ? List.of(normalized) : sentences;
    }

    private int findBestSplitEnd(String text, int start, int maxEnd, int chunkSize) {
        if (maxEnd >= text.length()) {
            return text.length();
        }

        int minEnd = Math.min(maxEnd, start + Math.max(1, (int) Math.floor(chunkSize * MIN_SPLIT_RATIO)));

        int sentenceEnd = findSentenceEndBefore(text, minEnd, maxEnd);
        if (sentenceEnd > start) {
            return sentenceEnd;
        }

        int newlineEnd = findWhitespaceEndBefore(text, minEnd, maxEnd, true);
        if (newlineEnd > start) {
            return newlineEnd;
        }

        int whitespaceEnd = findWhitespaceEndBefore(text, minEnd, maxEnd, false);
        if (whitespaceEnd > start) {
            return whitespaceEnd;
        }

        int anyWhitespaceEnd = findWhitespaceEndBefore(text, start + 1, maxEnd, false);
        return anyWhitespaceEnd > start ? anyWhitespaceEnd : maxEnd;
    }

    private int findSentenceEndBefore(String text, int minEnd, int maxEnd) {
        for (int i = maxEnd - 1; i >= minEnd; i--) {
            if (isSentenceTerminator(text.charAt(i))
                    && (i + 1 >= text.length() || Character.isWhitespace(text.charAt(i + 1)))) {
                return i + 1;
            }
        }
        return -1;
    }

    private int findWhitespaceEndBefore(String text, int minEnd, int maxEnd, boolean newlineOnly) {
        for (int i = maxEnd - 1; i >= minEnd; i--) {
            char c = text.charAt(i);
            if (newlineOnly ? c == '\n' : Character.isWhitespace(c)) {
                return i;
            }
        }
        return -1;
    }

    private int resolveNextStartWithOverlap(String text, int chunkStart, int chunkEnd, int overlap) {
        if (overlap <= 0) {
            return skipLeadingWhitespace(text, chunkEnd);
        }

        int target = Math.max(chunkStart + 1, chunkEnd - overlap);

        int sentenceStart = findSentenceStartAtOrAfter(text, target, chunkEnd);
        if (sentenceStart > chunkStart && sentenceStart < chunkEnd) {
            return skipLeadingWhitespace(text, sentenceStart);
        }

        int wordStart = findWordStartAtOrAfter(text, target, chunkEnd);
        if (wordStart > chunkStart && wordStart < chunkEnd) {
            return skipLeadingWhitespace(text, wordStart);
        }

        int previousWordStart = findWordStartBefore(text, target, chunkStart);
        if (previousWordStart > chunkStart && previousWordStart < chunkEnd) {
            return skipLeadingWhitespace(text, previousWordStart);
        }

        return skipLeadingWhitespace(text, chunkEnd);
    }

    private int findSentenceStartAtOrAfter(String text, int target, int endExclusive) {
        for (int i = target; i < endExclusive - 1; i++) {
            if (!isSentenceTerminator(text.charAt(i))) {
                continue;
            }

            int next = i + 1;
            while (next < endExclusive && Character.isWhitespace(text.charAt(next))) {
                next++;
            }
            if (next < endExclusive) {
                return next;
            }
        }
        return -1;
    }

    private int findWordStartAtOrAfter(String text, int target, int endExclusive) {
        for (int i = target; i < endExclusive - 1; i++) {
            if (Character.isWhitespace(text.charAt(i))) {
                return i + 1;
            }
        }
        return -1;
    }

    private int findWordStartBefore(String text, int target, int startExclusive) {
        for (int i = target - 1; i > startExclusive; i--) {
            if (Character.isWhitespace(text.charAt(i))) {
                return i + 1;
            }
        }
        return -1;
    }

    private int findTailWordBoundaryStart(String text, int overlapSize) {
        int target = Math.max(0, text.length() - overlapSize);

        int forwardStart = findWordStartAtOrAfter(text, target, text.length());
        if (forwardStart >= 0 && forwardStart < text.length()) {
            return forwardStart;
        }

        int backwardStart = findWordStartBefore(text, target, 0);
        if (backwardStart >= 0 && text.length() - backwardStart <= overlapSize + 40) {
            return backwardStart;
        }

        return text.length();
    }

    private int skipLeadingWhitespace(String text, int start) {
        int index = Math.max(0, start);
        while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
            index++;
        }
        return index;
    }

    private boolean isSentenceTerminator(char c) {
        return SENTENCE_TERMINATORS.indexOf(c) >= 0;
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
