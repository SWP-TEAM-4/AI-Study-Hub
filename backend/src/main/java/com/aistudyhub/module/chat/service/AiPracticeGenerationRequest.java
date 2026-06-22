package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeDifficulty;
import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;

import java.util.List;

public record AiPracticeGenerationRequest(
        AiPracticeType practiceType,
        String userPrompt,
        String language,
        CreateChatMessageRequest.PracticeGenerationOptions options,
        List<DocumentChunkResponse> relevantChunks
) {

    public int requestedQuestionCount() {
        return options != null && options.getNumberOfQuestions() != null
                ? options.getNumberOfQuestions()
                : 10;
    }

    public int requestedCardCount() {
        return options != null && options.getNumberOfCards() != null
                ? options.getNumberOfCards()
                : 20;
    }

    public QuestionType questionTypeOrDefault() {
        return options != null && options.getQuestionType() != null
                ? options.getQuestionType()
                : QuestionType.SINGLE_CHOICE;
    }

    public AiPracticeDifficulty difficultyOrDefault() {
        return options != null && options.getDifficulty() != null
                ? options.getDifficulty()
                : AiPracticeDifficulty.MEDIUM;
    }

    public String languageOrDefault() {
        return language == null || language.isBlank() ? "vi" : language.trim();
    }
}
