package com.aistudyhub.common.utils;

import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.Set;
import java.util.regex.Pattern;

public final class FileUtil {

    private static final Pattern UNSAFE_FILENAME_CHARS = Pattern.compile("[\\\\/:*?\"<>|\\p{Cntrl}]+");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain");

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "docx", "pptx", "txt");

    private FileUtil() {
    }

    public static boolean isAllowedType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && ALLOWED_TYPES.contains(contentType)) {
            return true;
        }
        return ALLOWED_EXTENSIONS.contains(getExtension(file.getOriginalFilename()));
    }

    public static String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null)
            return "file";
        String normalized = Normalizer.normalize(filename, Normalizer.Form.NFC)
                .replace('\u0000', ' ')
                .trim();
        normalized = UNSAFE_FILENAME_CHARS.matcher(normalized).replaceAll("_");
        normalized = WHITESPACE.matcher(normalized).replaceAll(" ").trim();
        normalized = normalized.replaceAll("^[. ]+", "").replaceAll("[. ]+$", "");
        return normalized.isBlank() ? "file" : normalized;
    }

    public static String sanitizePathSegment(String segment) {
        String sanitized = sanitizeFilename(segment);
        return sanitized.replace("..", "_");
    }
}
