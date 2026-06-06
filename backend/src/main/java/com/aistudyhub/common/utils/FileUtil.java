package com.aistudyhub.common.utils;

import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public final class FileUtil {

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
        return filename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
    }
}
