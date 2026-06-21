package com.aistudyhub.module.notification.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.Notification;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.notification.dto.NotificationResponse;
import com.aistudyhub.repository.NotificationRepository;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PaginationResponse<NotificationResponse> getMyNotifications(Long userId,
            String keyword,
            int page,
            int size,
            String sort) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(direction, "createdAt").and(Sort.by(direction, "id")));

        Page<NotificationResponse> result = notificationRepository.searchByUserId(
                userId,
                normalizeKeyword(keyword),
                pageable)
                .map(this::toResponse);

        return PaginationResponse.of(result);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId, Boolean isRead) {
        validateReadFlag(isRead);

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);
            log.info("Notification id={} marked as read by userId={}", notificationId, userId);
        }

        return toResponse(notification);
    }

    @Transactional
    public int markAllAsRead(Long userId, Boolean isRead) {
        validateReadFlag(isRead);
        int updatedCount = notificationRepository.markAllReadByUserId(userId);
        log.info("Marked {} notifications as read for userId={}", updatedCount, userId);
        return updatedCount;
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        notificationRepository.delete(notification);
        log.info("Deleted notification id={} for userId={}", notificationId, userId);
    }

    @Transactional
    public NotificationResponse createNotification(Long userId, String title, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!StringUtils.hasText(title)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Notification title is required");
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title.trim())
                .content(StringUtils.hasText(content) ? content.trim() : null)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification id={} for userId={}", saved.getId(), userId);
        return toResponse(saved);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private void validateReadFlag(Boolean isRead) {
        if (isRead != null && !Boolean.TRUE.equals(isRead)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "isRead must be true");
        }
    }
}
