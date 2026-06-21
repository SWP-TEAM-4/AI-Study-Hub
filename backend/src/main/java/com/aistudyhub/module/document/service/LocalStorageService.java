package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.utils.FileUtil;
import com.aistudyhub.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;

/**
 * Owner: BE1 – Local Storage implementation (MVP)
 * <p>
 * Lưu file vào thư mục ./uploads trên server.
 * Chỉ active khi STORAGE_TYPE=local (default).
 * <p>
 * Cấu trúc folder: {localStoragePath}/{userId}/{timestamp}_{sanitizedFilename}
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final StorageConfig storageConfig;

    @Override
    public StorageResult upload(MultipartFile file, Long userId) {
        try {
            // 1. Validate file
            if (!FileUtil.isAllowedType(file)) {
                throw new AppException(ErrorCode.INVALID_FILE_TYPE);
            }

            // 2. Build file path: ./uploads/{userId}/{timestamp}_{filename}
            String sanitizedName = FileUtil.sanitizeFilename(file.getOriginalFilename());
            String fileName = Instant.now().toEpochMilli() + "_" + sanitizedName;
            Path userDir = Paths.get(storageConfig.getLocalStoragePath(), String.valueOf(userId));
            Files.createDirectories(userDir);

            Path filePath = userDir.resolve(fileName);

            // 3. Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 4. Build paths
            String cloudFilePath = userId + "/" + fileName;  // relative path từ uploads root
            String fileUrl = storageConfig.getBaseUrl() + "/" + cloudFilePath;

            log.info("File saved locally: {} ({} bytes)", filePath, file.getSize());
            return new StorageResult(fileUrl, cloudFilePath);

        } catch (AppException e) {
            throw e;
        } catch (IOException e) {
            log.error("Failed to save file locally: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Failed to save file: " + e.getMessage());
        }
    }

    @Override
    public byte[] readFileContent(String cloudFilePath) {
        try {
            Path filePath = Paths.get(storageConfig.getLocalStoragePath(), cloudFilePath);
            if (!Files.exists(filePath)) {
                // Thử resolve như absolute path
                filePath = Paths.get(cloudFilePath);
                if (!Files.exists(filePath)) {
                    log.warn("File not found for reading: {}", cloudFilePath);
                    return null;
                }
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read local file: {}", cloudFilePath, e);
            return null;
        }
    }

    @Override
    public void deleteFile(String cloudFilePath) {
        try {
            Path filePath = Paths.get(storageConfig.getLocalStoragePath(), cloudFilePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted local file: {}", filePath);
            } else {
                log.warn("File not found for deletion: {}", filePath);
            }
        } catch (IOException e) {
            log.error("Failed to delete local file: {}", cloudFilePath, e);
        }
    }
}
