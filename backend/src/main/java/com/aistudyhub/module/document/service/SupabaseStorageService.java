package com.aistudyhub.module.document.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.utils.FileUtil;
import com.aistudyhub.config.StorageConfig;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Owner: BE1 – Supabase Storage implementation
 * <p>
 * Upload/read/delete file trên Supabase Storage thông qua REST API.
 * Chỉ active khi STORAGE_TYPE=supabase.
 * <p>
 * Cấu trúc path trên Supabase: documents/{userId}/{timestamp}_{filename}
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "supabase")
public class SupabaseStorageService implements StorageService {

    private final StorageConfig storageConfig;
    private final RestClient restClient;

    public SupabaseStorageService(StorageConfig storageConfig) {
        this.storageConfig = storageConfig;
        
        // Khởi tạo RestClient với baseURL và default authorization header (service role key)
        this.restClient = RestClient.builder()
                .baseUrl(storageConfig.getSupabaseUrl())
                .defaultHeader("Authorization", "Bearer " + storageConfig.getSupabaseServiceRoleKey())
                .build();
    }

    @PostConstruct
    public void validateConfig() {
        String url = storageConfig.getSupabaseUrl();
        String key = storageConfig.getSupabaseServiceRoleKey();
        
        if (url == null || url.isBlank() || url.contains("your-project")) {
            throw new IllegalStateException("Supabase URL (app.supabase.url) chưa được cấu hình chính xác trong application.yml. Hiện tại: " + url);
        }
        if (key == null || key.isBlank()) {
            throw new IllegalStateException("Supabase Service Role Key (app.supabase.service-role-key) là bắt buộc khi sử dụng Supabase Storage.");
        }
        
        log.info("Supabase Storage Service được kích hoạt thành công. Bucket: {}", storageConfig.getSupabaseStorageBucket());
    }

    /**
     * Upload file lên Supabase Storage.
     *
     * @param file   file từ multipart request
     * @param userId user ID để tổ chức folder
     * @return StorageResult với fileUrl và cloudFilePath (relative path trong bucket)
     */
    @Override
    public StorageResult upload(MultipartFile file, Long userId) {
        // 1. Validate file type
        if (!FileUtil.isAllowedType(file)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        try {
            // 2. Build file path: documents/{userId}/{timestamp}_{filename}
            String sanitizedName = FileUtil.sanitizeFilename(file.getOriginalFilename());
            String fileName = Instant.now().toEpochMilli() + "_" + sanitizedName;
            String filePath = "documents/" + userId + "/" + fileName;

            // 3. Resolve Content Type
            String contentType = resolveContentType(file);
            byte[] fileBytes = file.getBytes();

            log.info("Bắt đầu upload file lên Supabase Storage: {} ({} bytes)", filePath, fileBytes.length);

            // 4. Upload qua REST API
            restClient.post()
                    .uri("/storage/v1/object/{bucket}/{filePath}", storageConfig.getSupabaseStorageBucket(), filePath)
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("x-upsert", "true") // Cho phép ghi đè nếu trùng tên
                    .body(fileBytes)
                    .retrieve()
                    .toBodilessEntity();

            // 5. Tạo signed URL (hoặc fallback về public URL)
            String fileUrl = generateSignedUrl(filePath);

            log.info("Upload thành công lên Supabase Storage: {}", filePath);
            return new StorageResult(fileUrl, filePath);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi upload file lên Supabase: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Lỗi khi upload file lên Supabase: " + e.getMessage());
        }
    }

    /**
     * Đọc nội dung file từ Supabase Storage về dạng byte[].
     * Dùng cho TextExtractionService trong BE-016.
     */
    @Override
    public byte[] readFileContent(String cloudFilePath) {
        try {
            log.info("Đọc file từ Supabase Storage: {}", cloudFilePath);
            
            // Dùng endpoint authenticated để tải file (hỗ trợ cả bucket public và private thông qua Service Key)
            byte[] content = restClient.get()
                    .uri("/storage/v1/object/authenticated/{bucket}/{filePath}", 
                            storageConfig.getSupabaseStorageBucket(), cloudFilePath)
                    .retrieve()
                    .body(byte[].class);

            if (content == null) {
                log.warn("Nội dung tải về từ Supabase trống: {}", cloudFilePath);
                return null;
            }

            log.info("Đọc thành công {} bytes từ Supabase Storage: {}", content.length, cloudFilePath);
            return content;
        } catch (Exception e) {
            log.error("Lỗi khi đọc file từ Supabase: {}", cloudFilePath, e);
            return null;
        }
    }

    /**
     * Xóa file khỏi Supabase Storage.
     * Gọi khi user xóa document.
     */
    @Override
    public void deleteFile(String cloudFilePath) {
        try {
            log.info("Xóa file khỏi Supabase Storage: {}", cloudFilePath);

            // Supabase yêu cầu sử dụng body JSON với mảng prefixes để xóa file
            restClient.method(HttpMethod.DELETE)
                    .uri("/storage/v1/object/{bucket}", storageConfig.getSupabaseStorageBucket())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("prefixes", List.of(cloudFilePath)))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Đã gửi yêu cầu xóa file trên Supabase Storage thành công: {}", cloudFilePath);
        } catch (Exception e) {
            log.error("Lỗi khi xóa file trên Supabase: {}", cloudFilePath, e);
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Tạo signed URL có hiệu lực 7 ngày (604800 giây).
     * Nếu lỗi, sẽ fallback về public URL của bucket.
     */
    private String generateSignedUrl(String filePath) {
        try {
            Map<String, Object> response = restClient.post()
                    .uri("/storage/v1/object/sign/{bucket}/{filePath}", 
                            storageConfig.getSupabaseStorageBucket(), filePath)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("expiresIn", 604800))
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response != null) {
                if (response.containsKey("signedURL")) {
                    return (String) response.get("signedURL");
                } else if (response.containsKey("signedUrl")) {
                    return (String) response.get("signedUrl");
                }
            }
            throw new IllegalStateException("Không tìm thấy trường signedURL/signedUrl trong kết quả trả về.");
        } catch (Exception e) {
            // Fallback: trả về public URL trực tiếp
            log.warn("Không thể tạo signed URL cho {}, fallback sang public URL. Chi tiết: {}", filePath, e.getMessage());
            return storageConfig.getSupabaseUrl() + "/storage/v1/object/public/" 
                    + storageConfig.getSupabaseStorageBucket() + "/" + filePath;
        }
    }

    /**
     * Resolve content type từ file hoặc extension.
     */
    private String resolveContentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }
        String ext = FileUtil.getExtension(file.getOriginalFilename());
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt" -> "text/plain";
            default -> "application/octet-stream";
        };
    }
}
