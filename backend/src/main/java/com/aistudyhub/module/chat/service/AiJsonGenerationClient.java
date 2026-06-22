package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;

public interface AiJsonGenerationClient {

    String generate(AiPracticeGenerationRequest request, AiPracticePrompt prompt);

    default String repairMalformedJson(AiPracticeGenerationRequest request, AiPracticePrompt prompt,
                                       String malformedJson, String validationMessage) {
        throw new AppException(ErrorCode.AI_PRACTICE_INVALID_JSON,
                validationMessage == null || validationMessage.isBlank()
                        ? "AI returned malformed JSON and repair is not supported"
                        : validationMessage);
    }
}
