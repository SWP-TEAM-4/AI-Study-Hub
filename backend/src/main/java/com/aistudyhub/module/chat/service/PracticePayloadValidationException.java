package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;

@Getter
public class PracticePayloadValidationException extends RuntimeException {

    private final ErrorCode errorCode;
    private final JsonNode validationErrors;

    public PracticePayloadValidationException(ErrorCode errorCode, String message, JsonNode validationErrors) {
        super(message);
        this.errorCode = errorCode;
        this.validationErrors = validationErrors;
    }
}
