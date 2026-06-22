package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiPracticePayloadValidatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AiPracticePayloadValidator validator = new AiPracticePayloadValidator(objectMapper);

    @Test
    void validateQuizPayload_normalizesStringSourceRefsIntoObjects() {
        CreateChatMessageRequest.PracticeGenerationOptions options = new CreateChatMessageRequest.PracticeGenerationOptions();
        options.setNumberOfQuestions(1);
        options.setQuestionType(QuestionType.SINGLE_CHOICE);

        AiPracticeGenerationRequest request = new AiPracticeGenerationRequest(
                AiPracticeType.QUIZ,
                "Tao quiz cho chuong GenAI",
                "vi",
                options,
                List.of(DocumentChunkResponse.builder()
                        .documentId(11L)
                        .documentTitle("GenAI-in-NET-Development.pptx")
                        .chunkIndex(0)
                        .sourcePage(1)
                        .textContent("GenAI in .NET Development introduces integration points across the SDLC.")
                        .build())
        );

        String rawJson = """
                {
                  "type": "QUIZ",
                  "title": "Quiz GenAI",
                  "questions": [
                    {
                      "questionText": "GenAI ho tro gi trong .NET Development?",
                      "questionType": "SINGLE_CHOICE",
                      "explanation": "Duoc tong hop tu noi dung slide.",
                      "options": [
                        { "optionText": "Tich hop AI vao SDLC", "isCorrect": true },
                        { "optionText": "Chi tao database", "isCorrect": false }
                      ],
                      "sourceRefs": ["11-0-1"]
                    }
                  ]
                }
                """;

        AiPracticePayloadValidator.ValidatedPracticePayload result =
                validator.validate(AiPracticeType.QUIZ, rawJson, request);

        JsonNode sourceRef = result.normalizedPayload()
                .path("questions").path(0)
                .path("sourceRefs").path(0);

        assertEquals(11L, sourceRef.path("documentId").asLong());
        assertEquals(0, sourceRef.path("chunkIndex").asInt());
        assertEquals(1, sourceRef.path("sourcePage").asInt());
        assertEquals("GenAI in .NET Development introduces integration points across the SDLC.",
                sourceRef.path("excerpt").asText());
    }

    @Test
    void validateQuizPayload_normalizesMissingTitleAndOptionAliases() {
        CreateChatMessageRequest.PracticeGenerationOptions options = new CreateChatMessageRequest.PracticeGenerationOptions();
        options.setNumberOfQuestions(1);
        options.setQuestionType(QuestionType.SINGLE_CHOICE);

        AiPracticeGenerationRequest request = new AiPracticeGenerationRequest(
                AiPracticeType.QUIZ,
                "Tong hop chuong GenAI",
                "vi",
                options,
                List.of(DocumentChunkResponse.builder()
                        .documentId(11L)
                        .documentTitle("GenAI-in-NET-Development.pptx")
                        .chunkIndex(0)
                        .sourcePage(1)
                        .textContent("GenAI in .NET Development introduces integration points across the SDLC.")
                        .build())
        );

        String rawJson = """
                {
                  "questions": [
                    {
                      "question": "GenAI duoc tich hop vao dau?",
                      "type": "single",
                      "choices": [
                        { "text": "Software development lifecycle", "correct": true },
                        { "text": "Chi trong database", "correct": false }
                      ],
                      "correctAnswerIndex": 1,
                      "sourceRefs": ["11-0-1"]
                    }
                  ]
                }
                """;

        AiPracticePayloadValidator.ValidatedPracticePayload result =
                validator.validate(AiPracticeType.QUIZ, rawJson, request);

        JsonNode payload = result.normalizedPayload();
        assertEquals("QUIZ", payload.path("type").asText());
        assertTrue(payload.path("title").asText().startsWith("AI Quiz - "));
        assertEquals("GenAI duoc tich hop vao dau?", payload.path("questions").path(0).path("questionText").asText());
        assertEquals("SINGLE_CHOICE", payload.path("questions").path(0).path("questionType").asText());
        assertEquals("Software development lifecycle",
                payload.path("questions").path(0).path("options").path(0).path("optionText").asText());
        assertTrue(payload.path("questions").path(0).path("options").path(0).path("isCorrect").asBoolean());
    }
}
