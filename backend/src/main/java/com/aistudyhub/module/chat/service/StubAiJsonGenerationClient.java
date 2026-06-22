package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.module.chat.dto.practice.*;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.quiz.dto.OptionRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StubAiJsonGenerationClient implements AiJsonGenerationClient {

    private final ObjectMapper objectMapper;

    @Override
    public String generate(AiPracticeGenerationRequest request, AiPracticePrompt prompt) {
        String normalizedPrompt = request.userPrompt().toUpperCase();
        if (normalizedPrompt.contains("TRIGGER_PROVIDER_FAIL")) {
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    "Triggered provider failure in stub AI client");
        }
        if (normalizedPrompt.contains("TRIGGER_INVALID_JSON")) {
            return "{\"type\":";
        }
        if (normalizedPrompt.contains("TRIGGER_SCHEMA_INVALID")) {
            return request.practiceType() == AiPracticeType.QUIZ
                    ? "{\"type\":\"QUIZ\",\"title\":\"Broken Quiz\",\"questions\":[]}"
                    : "{\"type\":\"FLASHCARD\",\"title\":\"Broken Deck\",\"cards\":[]}";
        }

        try {
            return request.practiceType() == AiPracticeType.QUIZ
                    ? objectMapper.writeValueAsString(buildQuizPayload(request))
                    : objectMapper.writeValueAsString(buildFlashcardPayload(request));
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    "Failed to build stub AI practice payload: " + ex.getMessage());
        }
    }

    @Override
    public String repairMalformedJson(AiPracticeGenerationRequest request, AiPracticePrompt prompt,
                                      String malformedJson, String validationMessage) {
        try {
            return request.practiceType() == AiPracticeType.QUIZ
                    ? objectMapper.writeValueAsString(buildQuizPayload(request))
                    : objectMapper.writeValueAsString(buildFlashcardPayload(request));
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_PRACTICE_GENERATION_FAILED,
                    "Failed to repair stub AI practice payload: " + ex.getMessage());
        }
    }

    private QuizGeneratedPayload buildQuizPayload(AiPracticeGenerationRequest request) {
        List<QuizGeneratedQuestion> questions = new ArrayList<>();
        int total = request.requestedQuestionCount();
        for (int i = 0; i < total; i++) {
            DocumentChunkResponse chunk = request.relevantChunks().get(i % request.relevantChunks().size());
            String excerpt = normalizeSnippet(chunk.getTextContent());
            questions.add(QuizGeneratedQuestion.builder()
                    .questionText("Cau hoi AI " + (i + 1) + " tu " + chunk.getDocumentTitle())
                    .questionType(request.questionTypeOrDefault() == QuestionType.MULTIPLE_CHOICE
                            ? QuestionType.MULTIPLE_CHOICE
                            : QuestionType.SINGLE_CHOICE)
                    .explanation("Thong tin duoc tong hop tu chunk " + chunk.getChunkIndex())
                    .options(buildOptions(request.questionTypeOrDefault(), excerpt))
                    .sourceRefs(List.of(toSourceRef(chunk)))
                    .build());
        }

        return QuizGeneratedPayload.builder()
                .type("QUIZ")
                .title("AI Quiz tu tai lieu")
                .description("Bo cau hoi duoc sinh tu chat AI")
                .metadata(PracticeGenerationMetadata.builder()
                        .language(request.languageOrDefault())
                        .difficulty(request.difficultyOrDefault())
                        .requestedQuestionCount(request.requestedQuestionCount())
                        .generatedQuestionCount(questions.size())
                        .warnings(new ArrayList<>())
                        .build())
                .questions(questions)
                .build();
    }

    private FlashcardGeneratedPayload buildFlashcardPayload(AiPracticeGenerationRequest request) {
        List<FlashcardGeneratedCard> cards = new ArrayList<>();
        int total = request.requestedCardCount();
        for (int i = 0; i < total; i++) {
            DocumentChunkResponse chunk = request.relevantChunks().get(i % request.relevantChunks().size());
            cards.add(FlashcardGeneratedCard.builder()
                    .frontText("The AI " + (i + 1))
                    .backText(normalizeSnippet(chunk.getTextContent()))
                    .sourceRefs(List.of(toSourceRef(chunk)))
                    .build());
        }

        return FlashcardGeneratedPayload.builder()
                .type("FLASHCARD")
                .title("AI Flashcard tu tai lieu")
                .description("Bo flashcard duoc sinh tu chat AI")
                .metadata(PracticeGenerationMetadata.builder()
                        .language(request.languageOrDefault())
                        .difficulty(request.difficultyOrDefault())
                        .requestedCardCount(request.requestedCardCount())
                        .generatedCardCount(cards.size())
                        .warnings(new ArrayList<>())
                        .build())
                .cards(cards)
                .build();
    }

    private List<OptionRequest> buildOptions(QuestionType questionType, String excerpt) {
        List<OptionRequest> options = new ArrayList<>();
        if (questionType == QuestionType.MULTIPLE_CHOICE) {
            options.add(option(excerpt + " A", true));
            options.add(option(excerpt + " B", true));
            options.add(option("Thong tin sai", false));
            options.add(option("Thong tin nhieu", false));
            return options;
        }

        options.add(option(excerpt + " dung", true));
        options.add(option("Lua chon sai 1", false));
        options.add(option("Lua chon sai 2", false));
        options.add(option("Lua chon sai 3", false));
        return options;
    }

    private OptionRequest option(String optionText, boolean isCorrect) {
        OptionRequest option = new OptionRequest();
        option.setOptionText(optionText);
        option.setIsCorrect(isCorrect);
        return option;
    }

    private PracticeSourceRef toSourceRef(DocumentChunkResponse chunk) {
        return PracticeSourceRef.builder()
                .documentId(chunk.getDocumentId())
                .chunkIndex(chunk.getChunkIndex())
                .sourcePage(chunk.getSourcePage())
                .excerpt(normalizeSnippet(chunk.getTextContent()))
                .build();
    }

    private String normalizeSnippet(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Tai lieu khong co noi dung";
        }
        String normalized = raw.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 80 ? normalized : normalized.substring(0, 80).trim();
    }
}
