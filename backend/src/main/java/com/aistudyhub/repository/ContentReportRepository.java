package com.aistudyhub.repository;

import com.aistudyhub.common.enums.ReportStatus;
import com.aistudyhub.entity.ContentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;

/**
 * Repository cho bảng content_reports.
 * JpaSpecificationExecutor cho phép query linh hoạt với Specification (filter admin).
 * Owner: BE3 (Task BE-044)
 */
public interface ContentReportRepository extends JpaRepository<ContentReport, Long>,
        JpaSpecificationExecutor<ContentReport> {

    // ── Student: lấy danh sách báo cáo của chính mình ────────────────────────
    Page<ContentReport> findByReporterId(Long reporterId, Pageable pageable);

    // ── Chống spam: kiểm tra báo cáo trùng ở trạng thái chờ duyệt ────────────
    boolean existsByReporterIdAndDocumentIdAndStatus(Long reporterId, Long documentId, ReportStatus status);

    boolean existsByReporterIdAndQuizIdAndStatus(Long reporterId, Long quizId, ReportStatus status);

    boolean existsByReporterIdAndFlashcardDeckIdAndStatus(Long reporterId, Long flashcardDeckId, ReportStatus status);

    long countByReporterIdAndCreatedAtBetween(Long reporterId, LocalDateTime from, LocalDateTime to);
}
