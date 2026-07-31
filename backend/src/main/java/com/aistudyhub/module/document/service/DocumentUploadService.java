package com.aistudyhub.module.document.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.utils.FileUtil;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.document.dto.DocumentResponse;
import com.aistudyhub.module.document.dto.DocumentResponseMapper;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;

/**
 * Owner: BE2 (skeleton hoàn chỉnh bởi BE1 để unblock demo upload flow)
 * <p>
 * Service xử lý upload document:
 * 1. Validate file type + size
 * 2. Upload lên storage (local hoặc Supabase) qua StorageService
 * 3. Tạo Document entity trong DB
 * 4. Return DocumentResponse
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentUploadService {

    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024; // 50MB default

    private final StorageService storageService;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ActivityLogService activityLogService;
    private final DocumentAutoProcessingService documentAutoProcessingService;

    @Value("${spring.servlet.multipart.max-file-size:50MB}")
    private String maxFileSizeConfig;

    /**
     * Upload file và tạo Document record.
     *
     * @param file      multipart file từ request
     * @param userId    ID user đang upload
     * @param subjectId ID subject gắn với document (optional)
     * @param title     tiêu đề document
     * @param description mô tả (optional)
     * @return DocumentResponse với fileUrl và processingStatus=PENDING
     */
    @Transactional
    public DocumentResponse uploadDocument(
            MultipartFile file,
            Long userId,
            Long subjectId,
            String title,
            String description) {

        // 1. Validate file không rỗng
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.DOCUMENT_NO_FILE);
        }

        // 2. Validate file type
        if (!FileUtil.isAllowedType(file)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // 3. Validate file size (50MB max)
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }

        // 4. Lấy User
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 5. Lấy Subject (optional)
        Subject subject = null;
        if (subjectId != null) {
            subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        // 6. Xác định file type từ extension
        String fileType = FileUtil.getExtension(file.getOriginalFilename());

        // 7. Chuẩn hóa tên hiển thị, giữ tiếng Việt và tự đổi tên nếu trùng
        String requestedTitle = title != null && !title.isBlank()
                ? title.trim()
                : FileUtil.sanitizeFilename(file.getOriginalFilename());
        String uniqueTitle = resolveUniqueTitle(userId, requestedTitle);
        String storageFileName = ensureFileExtension(uniqueTitle, fileType);
        String subjectFolderName = resolveSubjectFolderName(subject);

        // 8. Upload file lên storage (local hoặc Supabase)
        StorageService.StorageResult storageResult = storageService.upload(
                file,
                userId,
                subjectFolderName,
                storageFileName);

        // 9. Tạo Document entity
        Document document = Document.builder()
                .user(user)
                .subject(subject)
                .title(uniqueTitle)
                .description(description)
                .fileUrl(storageResult.fileUrl())
                .cloudFilePath(storageResult.cloudFilePath())
                .fileType(fileType)
                .fileSize(file.getSize())
                .build();

        document = documentRepository.save(document);

        log.info("Document created: id={}, user={}, file={}, storage={}",
                document.getId(), userId, file.getOriginalFilename(), storageResult.cloudFilePath());

        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("title", document.getTitle());
        metadata.put("fileType", document.getFileType());
        metadata.put("subjectId", subject != null ? subject.getId() : null);
        metadata.put("fileSize", document.getFileSize());
        activityLogService.log(
                userId,
                ActivityActionType.UPLOAD_DOCUMENT,
                ActivityTargetType.DOCUMENT,
                document.getId(),
                metadata,
                document.getTitle(),
                document.getFileType(),
                subject != null ? subject.getCode() : null);

        scheduleAutomaticProcessing(document.getId(), userId);

        return DocumentResponseMapper.toResponse(document);
    }

    private String resolveUniqueTitle(Long userId, String requestedTitle) {
        String sanitizedTitle = FileUtil.sanitizeFilename(requestedTitle);
        if (!documentRepository.existsByUserIdAndTitleIgnoreCase(userId, sanitizedTitle)) {
            return sanitizedTitle;
        }

        String baseName = sanitizedTitle;
        String extension = "";
        int dotIndex = sanitizedTitle.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = sanitizedTitle.substring(0, dotIndex);
            extension = sanitizedTitle.substring(dotIndex);
        }

        int suffix = 1;
        String candidate;
        do {
            candidate = baseName + " (" + suffix + ")" + extension;
            suffix++;
        } while (documentRepository.existsByUserIdAndTitleIgnoreCase(userId, candidate));
        return candidate;
    }

    private String ensureFileExtension(String fileName, String fileType) {
        String sanitizedName = FileUtil.sanitizeFilename(fileName);
        if (fileType == null || fileType.isBlank()) {
            return sanitizedName;
        }
        String extension = "." + fileType.toLowerCase();
        return sanitizedName.toLowerCase().endsWith(extension)
                ? sanitizedName
                : sanitizedName + extension;
    }

    private String resolveSubjectFolderName(Subject subject) {
        if (subject == null) {
            return "Chưa phân môn";
        }
        String code = subject.getCode() != null ? subject.getCode().trim() : "";
        String name = subject.getName() != null ? subject.getName().trim() : "";
        String folderName = (code + (code.isBlank() || name.isBlank() ? "" : " - ") + name).trim();
        return folderName.isBlank() ? "Môn học " + subject.getId() : folderName;
    }

    private void scheduleAutomaticProcessing(Long documentId, Long userId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    documentAutoProcessingService.processUploadedDocument(documentId, userId);
                }
            });
            return;
        }
        documentAutoProcessingService.processUploadedDocument(documentId, userId);
    }
}
