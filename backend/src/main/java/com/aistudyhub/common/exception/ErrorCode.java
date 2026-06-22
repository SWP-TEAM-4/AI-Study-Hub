package com.aistudyhub.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Danh sách mã lỗi toàn hệ thống.
 * <p>
 * QUY TẮC: BE2/BE3 muốn thêm error code → tạo PR nhỏ, không tự ý sửa.
 */
@Getter
public enum ErrorCode {

        // ── Auth ────────────────────────────────────────────────────────────────
        EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email already exists", HttpStatus.CONFLICT),
        INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED),
        USER_INACTIVE("USER_INACTIVE", "Your account has been deactivated. Please contact admin.",
                        HttpStatus.FORBIDDEN),
        INVALID_RESET_TOKEN("INVALID_RESET_TOKEN", "Reset token is invalid or expired", HttpStatus.BAD_REQUEST),
        SAME_PASSWORD("SAME_PASSWORD", "New password must differ from current password", HttpStatus.BAD_REQUEST),

        // ── User ─────────────────────────────────────────────────────────────────
        USER_NOT_FOUND("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND),
        WRONG_PASSWORD("WRONG_PASSWORD", "Current password is incorrect", HttpStatus.BAD_REQUEST),
        CANNOT_DEACTIVATE_SELF("CANNOT_DEACTIVATE_SELF", "Admin cannot deactivate their own account",
                        HttpStatus.BAD_REQUEST),

        // ── Academic ─────────────────────────────────────────────────────────────
        SEMESTER_NOT_FOUND("SEMESTER_NOT_FOUND", "Semester not found", HttpStatus.NOT_FOUND),
        SEMESTER_CODE_DUPLICATE("SEMESTER_CODE_DUPLICATE", "Semester code already exists", HttpStatus.CONFLICT),
        COMBO_NOT_FOUND("COMBO_NOT_FOUND", "Combo not found", HttpStatus.NOT_FOUND),
        COMBO_CODE_DUPLICATE("COMBO_CODE_DUPLICATE", "Combo code already exists", HttpStatus.CONFLICT),
        SUBJECT_NOT_FOUND("SUBJECT_NOT_FOUND", "Subject not found", HttpStatus.NOT_FOUND),
        SUBJECT_CODE_DUPLICATE("SUBJECT_CODE_DUPLICATE", "Subject code already exists", HttpStatus.CONFLICT),
        COMBO_SUBJECT_DUPLICATE("COMBO_SUBJECT_DUPLICATE", "Subject already exists in this combo", HttpStatus.CONFLICT),
        TAG_NOT_FOUND("TAG_NOT_FOUND", "Tag not found", HttpStatus.NOT_FOUND),
        DOCUMENT_TAG_DUPLICATE("DOCUMENT_TAG_DUPLICATE", "Tag already added to this document", HttpStatus.CONFLICT),

        // ── Notebook ──────────────────────────────────────────────────────────────
        NOTEBOOK_NOT_FOUND("NOTEBOOK_NOT_FOUND", "Notebook not found", HttpStatus.NOT_FOUND),
        NOTEBOOK_ACCESS_DENIED("NOTEBOOK_ACCESS_DENIED", "You don't have access to this notebook",
                        HttpStatus.FORBIDDEN),

        // ── Chat / RAG ────────────────────────────────────────────────────────────
        CHAT_SESSION_NOT_FOUND("CHAT_SESSION_NOT_FOUND", "Chat session not found", HttpStatus.NOT_FOUND),
        CHAT_SESSION_ACCESS_DENIED("CHAT_SESSION_ACCESS_DENIED",
                        "You don't have access to this chat session", HttpStatus.FORBIDDEN),
        CHAT_MESSAGE_NOT_FOUND("CHAT_MESSAGE_NOT_FOUND", "Chat message not found", HttpStatus.NOT_FOUND),
        AI_PRACTICE_TYPE_INVALID("AI_PRACTICE_TYPE_INVALID", "Invalid AI practice prefix", HttpStatus.BAD_REQUEST),
        AI_PRACTICE_GENERATION_FAILED("AI_PRACTICE_GENERATION_FAILED", "AI practice generation failed",
                        HttpStatus.INTERNAL_SERVER_ERROR),
        AI_PRACTICE_INVALID_JSON("AI_PRACTICE_INVALID_JSON", "AI practice JSON is invalid", HttpStatus.BAD_REQUEST),
        AI_PRACTICE_SCHEMA_INVALID("AI_PRACTICE_SCHEMA_INVALID", "AI practice payload does not match schema",
                        HttpStatus.BAD_REQUEST),
        CHAT_MESSAGE_NOT_PRACTICE_DRAFT("CHAT_MESSAGE_NOT_PRACTICE_DRAFT",
                        "Chat message is not a practice draft", HttpStatus.BAD_REQUEST),
        PRACTICE_DRAFT_ALREADY_IMPORTED("PRACTICE_DRAFT_ALREADY_IMPORTED",
                        "Practice draft has already been imported", HttpStatus.CONFLICT),
        PRACTICE_DRAFT_NOT_READY("PRACTICE_DRAFT_NOT_READY", "Practice draft is not ready for this action",
                        HttpStatus.CONFLICT),
        PRACTICE_IMPORT_TARGET_INVALID("PRACTICE_IMPORT_TARGET_INVALID",
                        "Practice import target is invalid", HttpStatus.BAD_REQUEST),
        PRACTICE_IMPORT_PERMISSION_DENIED("PRACTICE_IMPORT_PERMISSION_DENIED",
                        "You do not have permission to import into this target", HttpStatus.FORBIDDEN),
        PRACTICE_IMPORT_DUPLICATE_ITEM("PRACTICE_IMPORT_DUPLICATE_ITEM",
                        "Practice import contains duplicate items", HttpStatus.CONFLICT),
        PRACTICE_IMPORT_ROLLBACK("PRACTICE_IMPORT_ROLLBACK",
                        "Practice import failed and was rolled back", HttpStatus.INTERNAL_SERVER_ERROR),
        QUIZ_IMPORT_FAILED("QUIZ_IMPORT_FAILED", "Quiz import failed", HttpStatus.INTERNAL_SERVER_ERROR),
        FLASHCARD_IMPORT_FAILED("FLASHCARD_IMPORT_FAILED", "Flashcard import failed",
                        HttpStatus.INTERNAL_SERVER_ERROR),

        // ── Document ──────────────────────────────────────────────────────────────
        DOCUMENT_NOT_FOUND("DOCUMENT_NOT_FOUND", "Document not found", HttpStatus.NOT_FOUND),
        DOCUMENT_ACCESS_DENIED("DOCUMENT_ACCESS_DENIED", "You don't have access to this document",
                        HttpStatus.FORBIDDEN),
        DOCUMENT_SHARE_LINK_NOT_FOUND("DOCUMENT_SHARE_LINK_NOT_FOUND", "Document share link not found",
                        HttpStatus.NOT_FOUND),
        DOCUMENT_SHARE_LINK_ALREADY_EXISTS("DOCUMENT_SHARE_LINK_ALREADY_EXISTS",
                        "Document share link already exists", HttpStatus.CONFLICT),
        DOCUMENT_SHARE_LINK_DISABLED("DOCUMENT_SHARE_LINK_DISABLED", "Document share link has been disabled",
                        HttpStatus.FORBIDDEN),
        DOCUMENT_SHARE_LINK_EXPIRED("DOCUMENT_SHARE_LINK_EXPIRED", "Document share link has expired",
                        HttpStatus.GONE),
        PREVIEW_NOT_ALLOWED("PREVIEW_NOT_ALLOWED", "Preview is not allowed for this share link",
                        HttpStatus.FORBIDDEN),
        DOWNLOAD_NOT_ALLOWED("DOWNLOAD_NOT_ALLOWED", "Download is not allowed for this share link",
                        HttpStatus.FORBIDDEN),
        INVALID_FILE_TYPE("INVALID_FILE_TYPE", "File type is not allowed", HttpStatus.BAD_REQUEST),
        FILE_TOO_LARGE("FILE_TOO_LARGE", "File size exceeds the maximum allowed", HttpStatus.BAD_REQUEST),
        NOTEBOOK_DOCUMENT_DUPLICATE("NOTEBOOK_DOCUMENT_DUPLICATE", "Document already added to this notebook",
                        HttpStatus.CONFLICT),

        // ── Document Chunk / Processing ──────────────────────────────────────────
        DOCUMENT_ALREADY_PROCESSING("DOCUMENT_ALREADY_PROCESSING",
                        "Document is currently being processed", HttpStatus.CONFLICT),
        DOCUMENT_PROCESSING_FAILED("DOCUMENT_PROCESSING_FAILED",
                        "Document processing failed", HttpStatus.INTERNAL_SERVER_ERROR),
        DOCUMENT_NO_FILE("DOCUMENT_NO_FILE",
                        "Document has no file attached for processing", HttpStatus.BAD_REQUEST),
        DOCUMENT_EMPTY_CONTENT("DOCUMENT_EMPTY_CONTENT",
                        "Extracted text content is empty", HttpStatus.BAD_REQUEST),
        UNSUPPORTED_FILE_TYPE("UNSUPPORTED_FILE_TYPE",
                        "File type is not allowed. Supported types: PDF, DOCX, PPTX, TXT", HttpStatus.BAD_REQUEST),
        FILE_SIZE_EXCEEDED("FILE_SIZE_EXCEEDED",
                        "File size exceeds maximum allowed limit", HttpStatus.BAD_REQUEST),
        TEXT_EXTRACTION_FAILED("TEXT_EXTRACTION_FAILED",
                        "Failed to extract text from document", HttpStatus.INTERNAL_SERVER_ERROR),
        GEMINI_CHUNKING_FAILED("GEMINI_CHUNKING_FAILED",
                        "Gemini API chunking failed", HttpStatus.INTERNAL_SERVER_ERROR),
        GEMINI_EMPTY_RESPONSE("GEMINI_EMPTY_RESPONSE",
                        "Gemini API returned empty response", HttpStatus.INTERNAL_SERVER_ERROR),
        TOO_MANY_CHUNKS("TOO_MANY_CHUNKS",
                        "Document exceeds maximum chunk limit", HttpStatus.BAD_REQUEST),
        EMBEDDING_GENERATION_FAILED("EMBEDDING_GENERATION_FAILED",
                        "Failed to generate embeddings", HttpStatus.INTERNAL_SERVER_ERROR),
        OPENAI_AUTH_FAILED("OPENAI_AUTH_FAILED",
                        "OpenAI API authentication failed", HttpStatus.UNAUTHORIZED),
        SUPABASE_STORAGE_ERROR("SUPABASE_STORAGE_ERROR",
                        "Supabase storage operation failed", HttpStatus.INTERNAL_SERVER_ERROR),

        // ── Quiz / Test ───────────────────────────────────────────────────────────
        QUIZ_NOT_FOUND("QUIZ_NOT_FOUND", "Quiz not found", HttpStatus.NOT_FOUND),
        QUIZ_ACCESS_DENIED("QUIZ_ACCESS_DENIED", "You don't have access to this quiz", HttpStatus.FORBIDDEN),
        QUESTION_NOT_FOUND("QUESTION_NOT_FOUND", "Question not found", HttpStatus.NOT_FOUND),
        OPTION_NOT_FOUND("OPTION_NOT_FOUND", "Option not found", HttpStatus.NOT_FOUND),
        TEST_NOT_FOUND("TEST_NOT_FOUND", "Test not found", HttpStatus.NOT_FOUND),
        TEST_ALREADY_COMPLETED("TEST_ALREADY_COMPLETED", "Test has already been submitted", HttpStatus.BAD_REQUEST),
        TEST_ACCESS_DENIED("TEST_ACCESS_DENIED", "You don't have access to this test", HttpStatus.FORBIDDEN),
        QUESTION_NOT_IN_QUIZ("QUESTION_NOT_IN_QUIZ", "Some questionIds do not belong to this quiz",
                        HttpStatus.BAD_REQUEST),
        NOT_ENOUGH_QUESTIONS("NOT_ENOUGH_QUESTIONS", "randomCount exceeds available questions in quiz",
                        HttpStatus.BAD_REQUEST),
        EMPTY_QUESTION_SELECTION("EMPTY_QUESTION_SELECTION", "selectionMode=SELECTED requires at least one questionId",
                        HttpStatus.BAD_REQUEST),

        // ── Flashcard ─────────────────────────────────────────────────────────────
        FLASHCARD_DECK_NOT_FOUND("FLASHCARD_DECK_NOT_FOUND", "Flashcard deck not found", HttpStatus.NOT_FOUND),
        FLASHCARD_NOT_FOUND("FLASHCARD_NOT_FOUND", "Flashcard not found", HttpStatus.NOT_FOUND),
        FLASHCARD_DECK_ACCESS_DENIED("FLASHCARD_DECK_ACCESS_DENIED", "You don't have access to this flashcard deck",
                        HttpStatus.FORBIDDEN),

        // ── Marketplace ───────────────────────────────────────────────────────────
        CONTENT_NOT_APPROVED("CONTENT_NOT_APPROVED", "Content is not approved for marketplace", HttpStatus.BAD_REQUEST),
        CONTENT_NOT_MARKETPLACE("CONTENT_NOT_MARKETPLACE", "Content is not available in marketplace",
                        HttpStatus.NOT_FOUND),

        // ── Governance ────────────────────────────────────────────────────────────
        REPORT_NOT_FOUND("REPORT_NOT_FOUND", "Report not found", HttpStatus.NOT_FOUND),
        INVALID_REPORT_TARGET("INVALID_REPORT_TARGET", "Report must target exactly one content item",
                        HttpStatus.BAD_REQUEST),
        REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "Review not found", HttpStatus.NOT_FOUND),
        DUPLICATE_REVIEW("DUPLICATE_REVIEW", "You have already reviewed this content", HttpStatus.CONFLICT),

        // ── Community Role ────────────────────────────────────────────────────────
        COMMUNITY_ROLE_NOT_FOUND("COMMUNITY_ROLE_NOT_FOUND", "Community role not found", HttpStatus.NOT_FOUND),
        COMMUNITY_ROLE_ALREADY_ACTIVE("COMMUNITY_ROLE_ALREADY_ACTIVE",
                        "An active community role with the same scope already exists", HttpStatus.CONFLICT),
        COMMUNITY_ROLE_PERMISSION_DENIED("COMMUNITY_ROLE_PERMISSION_DENIED",
                        "You don't have the required community role for this action", HttpStatus.FORBIDDEN),

        // ── Notification ──────────────────────────────────────────────────────────
        NOTIFICATION_NOT_FOUND("NOTIFICATION_NOT_FOUND", "Notification not found", HttpStatus.NOT_FOUND),

        // ── System Feedback ───────────────────────────────────────────────────────
        SYSTEM_FEEDBACK_NOT_FOUND("SYSTEM_FEEDBACK_NOT_FOUND", "System feedback not found", HttpStatus.NOT_FOUND),

        // ── System Config ─────────────────────────────────────────────────────────
        SYSTEM_CONFIG_NOT_FOUND("SYSTEM_CONFIG_NOT_FOUND", "System config not found", HttpStatus.NOT_FOUND),
        SYSTEM_CONFIG_KEY_DUPLICATE("SYSTEM_CONFIG_KEY_DUPLICATE", "Config key already exists", HttpStatus.CONFLICT),

        // ── Badge ─────────────────────────────────────────────────────────────────
        BADGE_NOT_FOUND("BADGE_NOT_FOUND", "Badge not found", HttpStatus.NOT_FOUND),
        BADGE_ALREADY_ASSIGNED("BADGE_ALREADY_ASSIGNED", "Badge already assigned to this user", HttpStatus.CONFLICT),

        // ── Access Control ────────────────────────────────────────────────────────
        ACCESS_DENIED("ACCESS_DENIED", "You don't have permission to perform this action", HttpStatus.FORBIDDEN),
        UNAUTHORIZED("UNAUTHORIZED", "Authentication required", HttpStatus.UNAUTHORIZED),

        // ── Generic ───────────────────────────────────────────────────────────────
        INTERNAL_ERROR("INTERNAL_ERROR", "An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR),
        VALIDATION_ERROR("VALIDATION_ERROR", "Validation failed", HttpStatus.BAD_REQUEST);

        private final String code;
        private final String message;
        private final HttpStatus httpStatus;

        ErrorCode(String code, String message, HttpStatus httpStatus) {
                this.code = code;
                this.message = message;
                this.httpStatus = httpStatus;
        }
}
