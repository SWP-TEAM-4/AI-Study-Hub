package com.aistudyhub.module.feedback.service;

import com.aistudyhub.common.enums.SystemFeedbackStatus;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.SystemFeedback;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.feedback.dto.CreateSystemFeedbackRequest;
import com.aistudyhub.module.feedback.dto.SystemFeedbackResponse;
import com.aistudyhub.module.feedback.dto.UpdateSystemFeedbackStatusRequest;
import com.aistudyhub.repository.SystemFeedbackRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemFeedbackService {

    private final SystemFeedbackRepository systemFeedbackRepository;
    private final UserRepository userRepository;

    @Transactional
    public SystemFeedbackResponse submitFeedback(CreateSystemFeedbackRequest request, Long currentUserId) {
        User user = userRepository.findByIdAndIsActiveTrue(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        SystemFeedback feedback = SystemFeedback.builder()
                .user(user)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .screenUrl(request.getScreenUrl().trim())
                .status(SystemFeedbackStatus.OPEN)
                .build();

        SystemFeedback saved = systemFeedbackRepository.save(feedback);
        log.info("User {} submitted system feedback {}", currentUserId, saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaginationResponse<SystemFeedbackResponse> getMyFeedbacks(Long currentUserId,
            int page,
            int size,
            String sort) {

        userRepository.findByIdAndIsActiveTrue(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<SystemFeedbackResponse> result = systemFeedbackRepository.findByUserId(currentUserId, pageable)
                .map(this::toResponse);

        return PaginationResponse.of(result);
    }

    @Transactional(readOnly = true)
    public PaginationResponse<SystemFeedbackResponse> searchFeedbacks(String keyword,
            String status,
            int page,
            int size,
            String sort) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<SystemFeedbackResponse> result = systemFeedbackRepository.searchFeedbacks(
                normalizeKeyword(keyword),
                parseStatusOrNull(status),
                pageable)
                .map(this::toResponse);

        return PaginationResponse.of(result);
    }

    @Transactional
    public SystemFeedbackResponse updateStatus(Long feedbackId,
            UpdateSystemFeedbackStatusRequest request,
            Long adminId) {

        SystemFeedback feedback = systemFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_FEEDBACK_NOT_FOUND));

        feedback.setStatus(parseStatus(request.getStatus()));
        feedback.setAdminNote(normalizeNullable(request.getAdminNote()));

        SystemFeedback saved = systemFeedbackRepository.save(feedback);
        log.info("Admin {} updated system feedback {} to status={} adminNotePresent={}",
                adminId, feedbackId, saved.getStatus(), StringUtils.hasText(saved.getAdminNote()));

        return toResponse(saved);
    }

    private SystemFeedbackResponse toResponse(SystemFeedback feedback) {
        return SystemFeedbackResponse.builder()
                .id(feedback.getId())
                .userId(feedback.getUser() != null ? feedback.getUser().getId() : null)
                .title(feedback.getTitle())
                .content(feedback.getContent())
                .screenUrl(feedback.getScreenUrl())
                .status(feedback.getStatus())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private SystemFeedbackStatus parseStatusOrNull(String rawStatus) {
        if (!StringUtils.hasText(rawStatus)) {
            return null;
        }
        return parseStatus(rawStatus);
    }

    private SystemFeedbackStatus parseStatus(String rawStatus) {
        if (!StringUtils.hasText(rawStatus)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Status is required");
        }
        try {
            return SystemFeedbackStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Invalid status: " + rawStatus);
        }
    }
}
