package com.aistudyhub.module.community.service;

import com.aistudyhub.common.enums.ReputationEventType;
import com.aistudyhub.common.enums.ReportStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.*;
import com.aistudyhub.module.community.dto.ContentReportRequest;
import com.aistudyhub.module.community.dto.ContentReportResponse;
import com.aistudyhub.module.community.service.CommunityPermissionService.ContentTarget;
import com.aistudyhub.module.reputation.service.ReputationService;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service xử lý nghiệp vụ báo cáo nội dung vi phạm (Content Report).
 * <p>
 * 3 API chính:
 * 1. createReport – Student tạo báo cáo vi phạm
 * 2. getMyReports – Student xem danh sách báo cáo của mình
 * 3. getAdminReports – Admin/Moderator xem danh sách báo cáo toàn hệ thống
 * <p>
 * Owner: BE3 (Task BE-044)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContentReportService {

    private static final java.util.List<String> ALLOWED_REASONS = java.util.List.of(
            "LO_DE_CHINH_QUY",
            "SAI_DAP_AN_CORE",
            "SPAM",
            "DOC_HAI",
            "COPYRIGHT",
            "DUPLICATE",
            "OTHER");

    private final ContentReportRepository contentReportRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final UserService userService;
    private final CommunityPermissionService communityPermissionService;
    private final com.aistudyhub.module.notification.service.NotificationService notificationService;
    private final ReputationService reputationService;

    // ── 1. Tạo báo cáo vi phạm ────────────────────────────────────────────────

    /**
     * Tạo một báo cáo vi phạm nội dung mới.
     * <p>
     * Quy tắc:
     * - Kiểm tra tài nguyên đích có tồn tại hay không.
     * - Mỗi report chỉ trỏ tới đúng 1 target (1 trong 3 FK, 2 còn lại null).
     * - Trạng thái mặc định: PENDING_ADMIN.
     *
     * @param request thông tin báo cáo từ FE
     * @return ContentReportResponse chứa thông tin báo cáo vừa tạo
     */
    @Transactional
    public ContentReportResponse createReport(ContentReportRequest request) {
        // Bước 1: Lấy user hiện tại từ Security Context
        User currentUser = userService.getCurrentUser();
        Long userId = currentUser.getId();

        // Bước 1.5: Validate reasonType
        String reasonTypeInput = request.getReasonType();
        if (reasonTypeInput == null || !ALLOWED_REASONS.contains(reasonTypeInput.trim().toUpperCase())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Invalid reasonType. Must be one of: " + String.join(", ", ALLOWED_REASONS));
        }

        // Bước 2: Chuẩn hóa targetType
        String targetType = normalizeTargetType(request.getTargetType());
        Long targetId = request.getTargetId();

        // Bước 3: Build entity với trạng thái mặc định PENDING_ADMIN
        ContentReport report = ContentReport.builder()
                .reporter(currentUser)
                .reasonType(reasonTypeInput.trim().toUpperCase())
                .reportDetails(request.getReportDetails())
                .severityLevel(normalizeSeverityLevel(request.getSeverityLevel()))
                .status(ReportStatus.PENDING_ADMIN)
                .build();

        // Bước 4: Validate tài nguyên tồn tại + Chống spam + set FK tương ứng
        String targetTitle;
        switch (targetType) {
            case "DOCUMENT" -> {
                Document document = documentRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                // Chống spam: không cho báo cáo lại nếu báo cáo cũ đang PENDING_ADMIN
                if (contentReportRepository.existsByReporterIdAndDocumentIdAndStatus(
                        userId, targetId, ReportStatus.PENDING_ADMIN)) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR,
                            "You have already reported this document and it is pending moderation");
                }
                report.setDocument(document);
                targetTitle = document.getTitle();
            }
            case "QUIZ" -> {
                Quiz quiz = quizRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                // Chống spam: không cho báo cáo lại nếu báo cáo cũ đang PENDING_ADMIN
                if (contentReportRepository.existsByReporterIdAndQuizIdAndStatus(
                        userId, targetId, ReportStatus.PENDING_ADMIN)) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR,
                            "You have already reported this quiz and it is pending moderation");
                }
                report.setQuiz(quiz);
                targetTitle = quiz.getTitle();
            }
            case "FLASHCARD_DECK" -> {
                FlashcardDeck deck = flashcardDeckRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                // Chống spam: không cho báo cáo lại nếu báo cáo cũ đang PENDING_ADMIN
                if (contentReportRepository.existsByReporterIdAndFlashcardDeckIdAndStatus(
                        userId, targetId, ReportStatus.PENDING_ADMIN)) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR,
                            "You have already reported this flashcard deck and it is pending moderation");
                }
                report.setFlashcardDeck(deck);
                targetTitle = deck.getTitle();
            }
            default -> throw new AppException(ErrorCode.INVALID_REPORT_TARGET);
        }

        // Bước 5: Lưu vào DB
        report = contentReportRepository.save(report);

        log.info("Content report created: id={}, userId={}, targetType={}, targetId={}",
                report.getId(), currentUser.getId(), targetType, targetId);

        return toResponse(report, targetType, targetId, targetTitle);
    }

    // ── 2. Student xem danh sách báo cáo của mình ─────────────────────────────

    /**
     * Lấy danh sách báo cáo do người dùng hiện tại tạo (phân trang).
     * Hỗ trợ tìm kiếm theo keyword (report_details) và sắp xếp.
     *
     * @param page    trang hiện tại (mặc định 0)
     * @param size    kích thước trang (mặc định 10)
     * @param keyword từ khóa tìm kiếm (không bắt buộc)
     * @param sort    sắp xếp: newest (mặc định) hoặc oldest
     * @return PaginationResponse chứa danh sách báo cáo
     */
    @Transactional(readOnly = true)
    public PaginationResponse<ContentReportResponse> getMyReports(
            int page, int size, String keyword, String sort) {

        // Lấy user hiện tại
        User currentUser = userService.getCurrentUser();
        Long userId = currentUser.getId();

        // Xác định hướng sắp xếp
        Pageable pageable = buildPageable(page, size, sort);

        // Dùng Specification để hỗ trợ tìm kiếm keyword linh hoạt
        Specification<ContentReport> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Chỉ lấy báo cáo của user hiện tại
            predicates.add(cb.equal(root.get("reporter").get("id"), userId));

            // Tìm kiếm theo keyword trong reportDetails
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("reportDetails")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ContentReport> reportPage = contentReportRepository.findAll(spec, pageable);
        Page<ContentReportResponse> responsePage = reportPage.map(this::toResponse);

        return PaginationResponse.of(responsePage);
    }

    // ── 3. Admin/Moderator xem danh sách báo cáo toàn hệ thống ────────────────

    /**
     * Lấy danh sách báo cáo toàn hệ thống cho Admin hoặc Moderator.
     * <p>
     * - Admin: xem toàn bộ báo cáo.
     * - Moderator (CONTENT_MODERATOR / SUBJECT_MODERATOR): chỉ xem báo cáo
     * liên quan đến tài nguyên trong phạm vi quản lý của mình.
     *
     * @param page          trang hiện tại
     * @param size          kích thước trang
     * @param keyword       từ khóa tìm kiếm
     * @param sort          sắp xếp
     * @param status        lọc theo trạng thái (PENDING_ADMIN, RESOLVED, REJECTED)
     * @param severityLevel lọc theo mức độ nghiêm trọng (LOW, MEDIUM, HIGH)
     * @return PaginationResponse chứa danh sách báo cáo
     */
    @Transactional(readOnly = true)
    public PaginationResponse<ContentReportResponse> getAdminReports(
            int page, int size, String keyword, String sort,
            String status, String severityLevel) {

        // Bước 1: Lấy user hiện tại và kiểm tra quyền
        User currentUser = userService.getCurrentUser();
        boolean isAdmin = communityPermissionService.isAdmin(currentUser);

        Pageable pageable = buildPageable(page, size, sort);

        // Bước 2: Build Specification để filter
        Specification<ContentReport> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Lọc theo trạng thái nếu có
            if (status != null && !status.isBlank()) {
                try {
                    ReportStatus reportStatus = ReportStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), reportStatus));
                } catch (IllegalArgumentException ignored) {
                    // Nếu status không hợp lệ thì bỏ qua filter này
                }
            }

            // Lọc theo mức độ nghiêm trọng nếu có
            if (severityLevel != null && !severityLevel.isBlank()) {
                predicates.add(cb.equal(
                        cb.upper(root.get("severityLevel")),
                        severityLevel.trim().toUpperCase()));
            }

            // Tìm kiếm theo keyword trong reportDetails
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("reportDetails")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ContentReport> reportPage = contentReportRepository.findAll(spec, pageable);

        // Bước 3: Nếu không phải admin, lọc thêm theo quyền moderator
        if (!isAdmin) {
            Long userId = currentUser.getId();
            List<ContentReport> scopedReports = contentReportRepository.findAll(
                    spec,
                    "oldest".equalsIgnoreCase(sort)
                            ? Sort.by(Sort.Direction.ASC, "createdAt")
                            : Sort.by(Sort.Direction.DESC, "createdAt"));

            List<ContentReportResponse> filteredItems = scopedReports.stream()
                    .filter(report -> {
                        ContentTarget target = resolveContentTarget(report);
                        return communityPermissionService.canModerateReport(userId, target);
                    })
                    .map(this::toResponse)
                    .toList();

            int safePage = Math.max(page, 0);
            int safeSize = Math.max(size, 1);
            int fromIndex = Math.min(safePage * safeSize, filteredItems.size());
            int toIndex = Math.min(fromIndex + safeSize, filteredItems.size());
            return PaginationResponse.of(
                    filteredItems.subList(fromIndex, toIndex),
                    safePage,
                    safeSize,
                    filteredItems.size());
        }

        // Admin: trả về toàn bộ kết quả
        Page<ContentReportResponse> responsePage = reportPage.map(this::toResponse);
        return PaginationResponse.of(responsePage);
    }

    // ── 4. Duyệt báo cáo (Resolve) ───────────────────────────────────────────

    /**
     * Admin/Moderator duyệt báo cáo vi phạm (RESOLVED).
     *
     * @param reportId  ID báo cáo cần duyệt
     * @param adminNote ghi chú xử lý của Admin
     * @param page      trang hiện tại
     * @param size      kích thước trang
     * @return PaginationResponse chứa danh sách báo cáo sau cập nhật
     */
    @Transactional
    public PaginationResponse<ContentReportResponse> resolveReport(
            Long reportId, String adminNote, int page, int size) {

        // Bước 1: Lấy user hiện tại (Admin/Moderator)
        User currentUser = userService.getCurrentUser();

        // Bước 2: Tìm báo cáo và validate
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        // Bước 3: Kiểm tra báo cáo chưa được xử lý
        if (report.getStatus() != ReportStatus.PENDING_ADMIN) {
            throw new AppException(ErrorCode.REPORT_ALREADY_PROCESSED);
        }

        // Bước 4: Kiểm tra quyền moderator (nếu không phải admin)
        ContentTarget target = resolveContentTarget(report);
        communityPermissionService.assertCanModerateReport(currentUser.getId(), target);

        // Bước 5: Cập nhật trạng thái báo cáo
        report.setStatus(ReportStatus.RESOLVED);
        report.setAdminNote(adminNote);
        report.setResolvedBy(currentUser);
        contentReportRepository.save(report);
        rewardReportResolved(report, currentUser.getId());

        log.info("Report id={} resolved by userId={}", reportId, currentUser.getId());

        // Bước 6: Gửi thông báo cho người báo cáo
        sendReportNotification(report, "Report processed",
                "Your report #" + reportId + " has been reviewed and processed.");

        // Bước 7: Trả về danh sách báo cáo phân trang
        return getAdminReports(page, size, null, "newest", null, null);
    }

    // ── 5. Từ chối báo cáo (Reject) ──────────────────────────────────────────

    /**
     * Admin/Moderator từ chối báo cáo vi phạm (REJECTED).
     *
     * @param reportId  ID báo cáo cần từ chối
     * @param adminNote lý do từ chối
     * @param page      trang hiện tại
     * @param size      kích thước trang
     * @return PaginationResponse chứa danh sách báo cáo sau cập nhật
     */
    @Transactional
    public PaginationResponse<ContentReportResponse> rejectReport(
            Long reportId, String adminNote, int page, int size) {

        // Bước 1: Lấy user hiện tại (Admin/Moderator)
        User currentUser = userService.getCurrentUser();

        // Bước 2: Tìm báo cáo và validate
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.REPORT_NOT_FOUND));

        // Bước 3: Kiểm tra báo cáo chưa được xử lý
        if (report.getStatus() != ReportStatus.PENDING_ADMIN) {
            throw new AppException(ErrorCode.REPORT_ALREADY_PROCESSED);
        }

        // Bước 4: Kiểm tra quyền moderator (nếu không phải admin)
        ContentTarget target = resolveContentTarget(report);
        communityPermissionService.assertCanModerateReport(currentUser.getId(), target);

        // Bước 5: Cập nhật trạng thái báo cáo
        report.setStatus(ReportStatus.REJECTED);
        report.setAdminNote(adminNote);
        report.setResolvedBy(currentUser);
        contentReportRepository.save(report);
        rewardReportRejected(report, currentUser.getId());

        log.info("Report id={} rejected by userId={}", reportId, currentUser.getId());

        // Bước 6: Gửi thông báo cho người báo cáo
        sendReportNotification(report, "Report rejected",
                "Your report #" + reportId + " has been reviewed and rejected.");

        // Bước 7: Trả về danh sách báo cáo phân trang
        return getAdminReports(page, size, null, "newest", null, null);
    }

    // ── 6. Ẩn nội dung vi phạm (Hide) ────────────────────────────────────────

    /**
     * Admin ẩn tài nguyên (Document/Quiz/FlashcardDeck) khỏi thư viện công cộng.
     *
     * @param targetType loại tài nguyên (DOCUMENT, QUIZ, FLASHCARD_DECK)
     * @param targetId   ID tài nguyên
     * @param reason     lý do ẩn nội dung
     * @return UserProfileResponse thông tin chủ sở hữu nội dung
     */
    @Transactional
    public com.aistudyhub.module.user.dto.UserProfileResponse hideContent(String targetType, Long targetId, String reason) {

        // Bước 1: Chuẩn hóa targetType
        String type = normalizeTargetType(targetType);

        // Bước 2: Tìm tài nguyên, cập nhật visibility và xác định chủ sở hữu
        User contentOwner;
        String contentTitle;
        Long subjectId;

        switch (type) {
            case "DOCUMENT" -> {
                Document document = documentRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                // Chuyển visibility → PRIVATE
                document.setVisibility(Visibility.PRIVATE);
                // Nếu đang trên Marketplace, chuyển marketStatus → REJECTED
                if (document.getMarketStatus() == MarketStatus.APPROVED
                        || document.getMarketStatus() == MarketStatus.PENDING) {
                    document.setMarketStatus(MarketStatus.REJECTED);
                }
                documentRepository.save(document);
                contentOwner = document.getUser();
                contentTitle = document.getTitle();
                subjectId = document.getSubject() != null ? document.getSubject().getId() : null;
            }
            case "QUIZ" -> {
                Quiz quiz = quizRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                // Chuyển visibility → PRIVATE
                quiz.setVisibility(Visibility.PRIVATE);
                // Nếu đang trên Marketplace, chuyển marketStatus → REJECTED
                if (quiz.getMarketStatus() == MarketStatus.APPROVED
                        || quiz.getMarketStatus() == MarketStatus.PENDING) {
                    quiz.setMarketStatus(MarketStatus.REJECTED);
                }
                quizRepository.save(quiz);
                contentOwner = quiz.getCreator();
                contentTitle = quiz.getTitle();
                subjectId = quiz.getSubject() != null ? quiz.getSubject().getId() : null;
            }
            case "FLASHCARD_DECK" -> {
                FlashcardDeck deck = flashcardDeckRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                // Chuyển visibility → PRIVATE
                deck.setVisibility(Visibility.PRIVATE);
                // Nếu đang trên Marketplace, chuyển marketStatus → REJECTED
                if (deck.getMarketStatus() == MarketStatus.APPROVED
                        || deck.getMarketStatus() == MarketStatus.PENDING) {
                    deck.setMarketStatus(MarketStatus.REJECTED);
                }
                flashcardDeckRepository.save(deck);
                contentOwner = deck.getUser();
                contentTitle = deck.getTitle();
                subjectId = deck.getSubject() != null ? deck.getSubject().getId() : null;
            }
            default -> throw new AppException(ErrorCode.INVALID_REPORT_TARGET);
        }

        reputationService.applyConfiguredEvent(
                contentOwner != null ? contentOwner.getId() : null,
                subjectId,
                ReputationEventType.CONTENT_HIDDEN_PENALTY,
                type,
                targetId,
                "CONTENT_MODERATION",
                targetId,
                reason,
                "CONTENT_HIDDEN_PENALTY:" + type + ":" + targetId,
                userService.getCurrentUserId());

        log.info("Content hidden: type={}, id={}, owner={}", type, targetId, contentOwner.getId());

        // Bước 3: Gửi thông báo cho chủ sở hữu nội dung
        String notifyContent = "Your content \"" + contentTitle + "\" has been hidden due to community guidelines violation."
                + (reason != null ? " Reason: " + reason : "");
        notificationService.createNotification(contentOwner.getId(),
                "Content hidden", notifyContent);

        // Bước 4: Trả về thông tin chủ sở hữu
        return userService.getUserById(contentOwner.getId());
    }

    // ── 7. Khôi phục nội dung đã ẩn (Restore) ────────────────────────────────

    /**
     * Admin khôi phục tài nguyên đã bị ẩn trước đó.
     *
     * @param targetType loại tài nguyên (DOCUMENT, QUIZ, FLASHCARD_DECK)
     * @param targetId   ID tài nguyên
     * @param reason     lý do khôi phục
     * @return UserProfileResponse thông tin chủ sở hữu nội dung
     */
    @Transactional
    public com.aistudyhub.module.user.dto.UserProfileResponse restoreContent(String targetType, Long targetId, String reason) {

        // Bước 1: Chuẩn hóa targetType
        String type = normalizeTargetType(targetType);

        // Bước 2: Tìm tài nguyên, khôi phục visibility và xác định chủ sở hữu
        User contentOwner;
        String contentTitle;

        switch (type) {
            case "DOCUMENT" -> {
                Document document = documentRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
                // Khôi phục visibility → PUBLIC_LINK
                document.setVisibility(Visibility.PUBLIC_LINK);
                documentRepository.save(document);
                contentOwner = document.getUser();
                contentTitle = document.getTitle();
            }
            case "QUIZ" -> {
                Quiz quiz = quizRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                // Khôi phục visibility → PUBLIC_LINK
                quiz.setVisibility(Visibility.PUBLIC_LINK);
                quizRepository.save(quiz);
                contentOwner = quiz.getCreator();
                contentTitle = quiz.getTitle();
            }
            case "FLASHCARD_DECK" -> {
                FlashcardDeck deck = flashcardDeckRepository.findById(targetId)
                        .orElseThrow(() -> new AppException(ErrorCode.FLASHCARD_DECK_NOT_FOUND));
                // Khôi phục visibility → PUBLIC_LINK
                deck.setVisibility(Visibility.PUBLIC_LINK);
                flashcardDeckRepository.save(deck);
                contentOwner = deck.getUser();
                contentTitle = deck.getTitle();
            }
            default -> throw new AppException(ErrorCode.INVALID_REPORT_TARGET);
        }

        log.info("Content restored: type={}, id={}, owner={}", type, targetId, contentOwner.getId());

        // Bước 3: Gửi thông báo cho chủ sở hữu nội dung
        String notifyContent = "Your content \"" + contentTitle + "\" has been successfully restored."
                + (reason != null ? " Reason: " + reason : "");
        notificationService.createNotification(contentOwner.getId(),
                "Content restored", notifyContent);

        // Bước 4: Trả về thông tin chủ sở hữu
        return userService.getUserById(contentOwner.getId());
    }

    /**
     * Gửi thông báo cho người báo cáo (reporter) khi báo cáo được xử lý.
     */
    private void sendReportNotification(ContentReport report, String title, String content) {
        try {
            User reporter = report.getReporter();
            if (reporter != null) {
                notificationService.createNotification(reporter.getId(), title, content);
            }
        } catch (Exception e) {
            // Không để lỗi notification ảnh hưởng đến nghiệp vụ chính
            log.warn("Failed to send report notification for reportId={}: {}", report.getId(), e.getMessage());
        }
    }

    private void rewardReportResolved(ContentReport report, Long actorUserId) {
        ContentRewardTarget target = resolveRewardTarget(report);
        reputationService.applyConfiguredEvent(
                report.getReporter() != null ? report.getReporter().getId() : null,
                target.subjectId(),
                ReputationEventType.CONTENT_REPORT_ACCEPTED,
                target.targetType(),
                target.targetId(),
                "CONTENT_REPORT",
                report.getId(),
                "Report accepted",
                "CONTENT_REPORT_ACCEPTED:" + report.getId(),
                actorUserId);

        reputationService.applyConfiguredEvent(
                target.ownerUserId(),
                target.subjectId(),
                ReputationEventType.CONTENT_REPORT_OWNER_PENALTY,
                target.targetType(),
                target.targetId(),
                "CONTENT_REPORT",
                report.getId(),
                "Report resolved against content",
                "CONTENT_REPORT_OWNER_PENALTY:" + report.getId(),
                actorUserId);
    }

    private void rewardReportRejected(ContentReport report, Long actorUserId) {
        ContentRewardTarget target = resolveRewardTarget(report);
        reputationService.applyConfiguredEvent(
                report.getReporter() != null ? report.getReporter().getId() : null,
                target.subjectId(),
                ReputationEventType.CONTENT_REPORT_REJECTED,
                target.targetType(),
                target.targetId(),
                "CONTENT_REPORT",
                report.getId(),
                "Report rejected",
                "CONTENT_REPORT_REJECTED:" + report.getId(),
                actorUserId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private helper methods
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Chuẩn hóa targetType về uppercase.
     */
    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REPORT_TARGET);
        }
        return targetType.trim().toUpperCase();
    }

    /**
     * Chuẩn hóa severityLevel, mặc định LOW nếu không truyền.
     */
    private String normalizeSeverityLevel(String severityLevel) {
        if (severityLevel == null || severityLevel.isBlank()) {
            return "LOW";
        }
        String normalized = severityLevel.trim().toUpperCase();
        // Validate giá trị hợp lệ
        if (!normalized.equals("LOW") && !normalized.equals("MEDIUM") && !normalized.equals("HIGH")) {
            return "LOW";
        }
        return normalized;
    }

    /**
     * Tạo Pageable với sort theo thời gian tạo.
     */
    private Pageable buildPageable(int page, int size, String sort) {
        Sort.Direction direction = "oldest".equalsIgnoreCase(sort)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, "createdAt"));
    }

    /**
     * Xác định ContentTarget từ entity ContentReport để check quyền moderator.
     */
    private ContentTarget resolveContentTarget(ContentReport report) {
        if (report.getDocument() != null) {
            return ContentTarget.document(report.getDocument().getId());
        }
        if (report.getQuiz() != null) {
            return ContentTarget.quiz(report.getQuiz().getId());
        }
        if (report.getFlashcardDeck() != null) {
            return ContentTarget.flashcardDeck(report.getFlashcardDeck().getId());
        }
        return ContentTarget.global();
    }

    private ContentRewardTarget resolveRewardTarget(ContentReport report) {
        if (report.getDocument() != null) {
            Document document = report.getDocument();
            return new ContentRewardTarget(
                    "DOCUMENT",
                    document.getId(),
                    document.getUser() != null ? document.getUser().getId() : null,
                    document.getSubject() != null ? document.getSubject().getId() : null);
        }
        if (report.getQuiz() != null) {
            Quiz quiz = report.getQuiz();
            return new ContentRewardTarget(
                    "QUIZ",
                    quiz.getId(),
                    quiz.getCreator() != null ? quiz.getCreator().getId() : null,
                    quiz.getSubject() != null ? quiz.getSubject().getId() : null);
        }
        if (report.getFlashcardDeck() != null) {
            FlashcardDeck deck = report.getFlashcardDeck();
            return new ContentRewardTarget(
                    "FLASHCARD_DECK",
                    deck.getId(),
                    deck.getUser() != null ? deck.getUser().getId() : null,
                    deck.getSubject() != null ? deck.getSubject().getId() : null);
        }
        return new ContentRewardTarget("UNKNOWN", null, null, null);
    }

    /**
     * Xác định targetType từ entity ContentReport.
     */
    private String resolveTargetType(ContentReport report) {
        if (report.getDocument() != null)
            return "DOCUMENT";
        if (report.getQuiz() != null)
            return "QUIZ";
        if (report.getFlashcardDeck() != null)
            return "FLASHCARD_DECK";
        return "UNKNOWN";
    }

    /**
     * Xác định targetId từ entity ContentReport.
     */
    private Long resolveTargetId(ContentReport report) {
        if (report.getDocument() != null)
            return report.getDocument().getId();
        if (report.getQuiz() != null)
            return report.getQuiz().getId();
        if (report.getFlashcardDeck() != null)
            return report.getFlashcardDeck().getId();
        return null;
    }

    /**
     * Xác định title của tài nguyên bị báo cáo.
     */
    private String resolveTargetTitle(ContentReport report) {
        if (report.getDocument() != null)
            return report.getDocument().getTitle();
        if (report.getQuiz() != null)
            return report.getQuiz().getTitle();
        if (report.getFlashcardDeck() != null)
            return report.getFlashcardDeck().getTitle();
        return null;
    }

    /**
     * Chuyển đổi ContentReport entity → ContentReportResponse DTO.
     * Dùng cho mapping đơn (khi không cần truyền sẵn targetType/targetId).
     */
    private ContentReportResponse toResponse(ContentReport report) {
        return toResponse(report,
                resolveTargetType(report),
                resolveTargetId(report),
                resolveTargetTitle(report));
    }

    /**
     * Chuyển đổi ContentReport entity → ContentReportResponse DTO.
     */
    private ContentReportResponse toResponse(ContentReport report, String targetType,
            Long targetId, String targetTitle) {
        User reporter = report.getReporter();
        return ContentReportResponse.builder()
                .id(report.getId())
                .targetType(targetType)
                .targetId(targetId)
                .targetTitle(targetTitle)
                .reasonType(report.getReasonType())
                .reportDetails(report.getReportDetails())
                .severityLevel(report.getSeverityLevel())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getFullName() : null)
                .adminNote(report.getAdminNote())
                .resolvedById(report.getResolvedBy() != null ? report.getResolvedBy().getId() : null)
                .resolvedByName(report.getResolvedBy() != null ? report.getResolvedBy().getFullName() : null)
                .createdAt(report.getCreatedAt())
                .build();
    }

    private record ContentRewardTarget(String targetType, Long targetId, Long ownerUserId, Long subjectId) {
    }
}
