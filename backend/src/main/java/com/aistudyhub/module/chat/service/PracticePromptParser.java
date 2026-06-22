package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PracticePromptParser {

    private static final Pattern PREFIX_PATTERN = Pattern.compile("^\\[(?<token>[A-Za-z_]+)]\\s*(?<prompt>.*)$");

    public ParsedPracticePrompt parse(String rawContent) {
        String normalized = rawContent == null ? "" : rawContent.trim();
        Matcher matcher = PREFIX_PATTERN.matcher(normalized);
        if (!matcher.matches()) {
            return new ParsedPracticePrompt(normalized, null, normalized);
        }

        String token = matcher.group("token").trim().toUpperCase(Locale.ROOT);
        String promptWithoutPrefix = matcher.group("prompt") == null ? "" : matcher.group("prompt").trim();
        AiPracticeType practiceType = switch (token) {
            case "QUIZ" -> AiPracticeType.QUIZ;
            case "FLASHCARD" -> AiPracticeType.FLASHCARD;
            default -> throw new AppException(ErrorCode.AI_PRACTICE_TYPE_INVALID,
                    "Unsupported AI practice prefix: [" + token + "]");
        };

        if (promptWithoutPrefix.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Practice prompt content is required after the prefix");
        }

        return new ParsedPracticePrompt(normalized, practiceType, promptWithoutPrefix);
    }

    public record ParsedPracticePrompt(String normalizedContent, AiPracticeType practiceType, String promptWithoutPrefix) {
        public boolean isPractice() {
            return practiceType != null;
        }
    }
}
