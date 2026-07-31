package com.aistudyhub.module.document.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Owner: BE1 – Storage abstraction
 * <p>
 * Interface cho file storage service.
 * Implementations:
 * - {@link LocalStorageService}   → STORAGE_TYPE=local (default, MVP)
 * - {@link SupabaseStorageService} → STORAGE_TYPE=supabase (production)
 * <p>
 * BE-013 (Upload API) sẽ gọi upload().
 * BE-016 (DocumentChunk) sẽ gọi readFileContent() để extract text.
 */
public interface StorageService {

    /**
     * Upload file lên storage.
     *
     * @param file       file upload từ multipart request
     * @param userId     ID của user upload (dùng để tổ chức folder)
     * @param folderName tên folder môn học
     * @param fileName   tên file đã được chuẩn hóa và tránh trùng
     * @return StorageResult chứa fileUrl (public URL) và cloudFilePath (path để xóa/đọc lại)
     */
    StorageResult upload(MultipartFile file, Long userId, String folderName, String fileName);

    /**
     * Backward-compatible upload signature for existing tests/callers.
     */
    default StorageResult upload(MultipartFile file, Long userId) {
        String fileName = file != null ? file.getOriginalFilename() : "file";
        return upload(file, userId, "Chưa phân môn", fileName);
    }

    /**
     * Đọc nội dung file (dùng cho text extraction trong BE-016).
     *
     * @param cloudFilePath path/key trả về từ upload()
     * @return byte array nội dung file
     */
    byte[] readFileContent(String cloudFilePath);

    /**
     * Xóa file khỏi storage (dùng khi xóa document).
     *
     * @param cloudFilePath path/key trả về từ upload()
     */
    void deleteFile(String cloudFilePath);

    /**
     * Result object sau khi upload thành công.
     */
    record StorageResult(
            String fileUrl,        // Public URL để frontend hiển thị/download
            String cloudFilePath   // Internal path để BE đọc/xóa file
    ) {
    }
}
