package com.aistudyhub.common.exception;

import lombok.Getter;

/**
 * Exception nghiệp vụ – ném khi gặp lỗi có thể xác định rõ mã lỗi.
 * <p>
 * Cách dùng: throw new AppException(ErrorCode.USER_NOT_FOUND);
 * throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND, "Document 42 not
 * found");
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}
