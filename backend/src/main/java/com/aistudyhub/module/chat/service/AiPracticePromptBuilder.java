package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import org.springframework.stereotype.Component;

@Component
public class AiPracticePromptBuilder {

    private static final int MAX_CONTEXT_CHUNKS = 8;

    public AiPracticePrompt build(AiPracticeGenerationRequest request) {
        StringBuilder instructions = new StringBuilder("""
                You are an AI study assistant. Use only the provided context chunks.
                Return only valid JSON. Do not return markdown. Do not add explanation outside JSON.
                The JSON must be importable into the backend schema.
                Every generated item must include sourceRefs based on provided chunks.
                sourceRefs must always be an array of JSON objects, never strings.
                Each sourceRef object must use this shape exactly:
                {"documentId": 123, "chunkIndex": 0, "sourcePage": 1, "excerpt": "short quote from the chunk"}.
                Do not use shorthand values like "11-0-1" or "doc:11/chunk:0".
                If the context is not enough, generate fewer items and set warnings in metadata.
                """.strip());

        if (request.practiceType() == AiPracticeType.QUIZ) {
            instructions.append("\n")
                    .append("""
                            Return JSON matching QuizGeneratedPayload schema.
                            The root object must include title, description, metadata, questions.
                            Each question must include questionText, questionType, options, explanation, sourceRefs.
                            Each option must be a JSON object with exactly these fields:
                            {"optionText": "text", "isCorrect": true}
                            Do not use fields such as text, label, value, answerText, correct, isAnswer.
                            For SINGLE_CHOICE, exactly one option must be correct.
                            For MULTIPLE_CHOICE, at least one option must be correct.
                            Do not generate duplicated questions.
                            """.strip());
        } else {
            instructions.append("\n")
                    .append("""
                            Return JSON matching FlashcardGeneratedPayload schema.
                            The root object must include title, description, metadata, cards.
                            Each card must include frontText, backText, sourceRefs.
                            frontText should be short. backText should be clear and study-friendly.
                            Do not generate duplicated cards.
                            """.strip());
        }

        StringBuilder input = new StringBuilder();
        input.append("Practice type: ").append(request.practiceType()).append("\n")
                .append("Output language: ").append(request.languageOrDefault()).append("\n")
                .append("Requested user prompt: ").append(request.userPrompt()).append("\n");

        if (request.practiceType() == AiPracticeType.QUIZ) {
            input.append("Requested question count: ").append(request.requestedQuestionCount()).append("\n")
                    .append("Question type: ").append(request.questionTypeOrDefault()).append("\n");
        } else {
            input.append("Requested card count: ").append(request.requestedCardCount()).append("\n");
        }
        input.append("Difficulty: ").append(request.difficultyOrDefault()).append("\n\n")
                .append("Context chunks:\n");

        int chunkCounter = 0;
        for (DocumentChunkResponse chunk : request.relevantChunks()) {
            if (chunkCounter++ >= MAX_CONTEXT_CHUNKS) {
                break;
            }
            input.append("---\n")
                    .append("Document ID: ").append(chunk.getDocumentId()).append("\n")
                    .append("Document Title: ").append(chunk.getDocumentTitle()).append("\n")
                    .append("Chunk Index: ").append(chunk.getChunkIndex()).append("\n");
            if (chunk.getSourcePage() != null) {
                input.append("Page: ").append(chunk.getSourcePage()).append("\n");
            }
            input.append("Content: ").append(chunk.getTextContent()).append("\n");
        }

        return new AiPracticePrompt(instructions.toString(), input.toString());
    }
}
