package com.aistudyhub.module.document.service;

import com.aistudyhub.config.ChunkConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class TextChunkingServiceTest {

    private TextChunkingService textChunkingService;

    @BeforeEach
    void setUp() {
        ChunkConfig chunkConfig = new ChunkConfig();
        ReflectionTestUtils.setField(chunkConfig, "chunkSize", 80);
        ReflectionTestUtils.setField(chunkConfig, "overlap", 15);
        ReflectionTestUtils.setField(chunkConfig, "maxChunksPerDoc", 100);

        textChunkingService = new TextChunkingService(chunkConfig);
    }

    @Test
    void localChunkingDoesNotSplitWordsWhenOversizedSentenceHasSpaces() {
        String text = IntStream.rangeClosed(1, 50)
                .mapToObj(i -> "word%03d".formatted(i))
                .collect(Collectors.joining(" ")) + ".";

        List<TextChunkingService.ChunkResult> chunks = textChunkingService.chunkText(text, 75, 12);

        assertThat(chunks).hasSizeGreaterThan(1);
        chunks.forEach(chunk -> assertWholeWordTokens(chunk.content()));
        assertThat(chunks).allSatisfy(chunk -> assertThat(chunk.content().length()).isLessThanOrEqualTo(75));
    }

    @Test
    void localChunkingPrefersSentenceBoundariesForLongParagraphs() {
        String text = """
                Câu thứ nhất giải thích khái niệm chính trong bài học.
                Câu thứ hai bổ sung ví dụ để người học hiểu rõ hơn.
                Câu thứ ba tổng kết nội dung và liên hệ với bài quiz.
                Câu thứ tư nhắc lại các ý quan trọng trước khi luyện tập.
                """;

        List<TextChunkingService.ChunkResult> chunks = textChunkingService.chunkText(text, 95, 0);

        assertThat(chunks).hasSizeGreaterThan(1);
        assertThat(chunks)
                .allSatisfy(chunk -> assertThat(chunk.content().trim()).endsWith("."));
    }

    @Test
    void localChunkingOverlapStartsAtWordBoundary() {
        String text = IntStream.rangeClosed(1, 40)
                .mapToObj(i -> "word%03d".formatted(i))
                .collect(Collectors.joining(" ")) + ".";

        List<TextChunkingService.ChunkResult> chunks = textChunkingService.chunkText(text, 70, 20);

        assertThat(chunks).hasSizeGreaterThan(1);
        chunks.stream()
                .skip(1)
                .forEach(chunk -> assertThat(firstToken(chunk.content())).matches("word\\d{3}"));
    }

    private void assertWholeWordTokens(String content) {
        for (String token : content.split("\\s+")) {
            String normalized = token.replaceAll("\\.+$", "");
            assertThat(normalized).matches("word\\d{3}");
        }
    }

    private String firstToken(String content) {
        return content.trim().split("\\s+")[0].replaceAll("\\.+$", "");
    }
}
