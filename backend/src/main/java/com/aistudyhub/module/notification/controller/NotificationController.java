package com.aistudyhub.module.notification.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.notification.dto.MarkAllNotificationsReadRequest;
import com.aistudyhub.module.notification.dto.MarkNotificationReadRequest;
import com.aistudyhub.module.notification.dto.NotificationDeleteResponse;
import com.aistudyhub.module.notification.dto.NotificationReadAllResponse;
import com.aistudyhub.module.notification.dto.NotificationResponse;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Notifications", description = "Quản lý notification của người dùng hiện tại")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Xem danh sách notification của bản thân")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort,
            @AuthenticationPrincipal CustomUserDetails principal) {

        PaginationResponse<NotificationResponse> response = notificationService.getMyNotifications(
                principal.getId(),
                keyword,
                page,
                size,
                sort);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Đánh dấu một notification là đã đọc")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @RequestBody(required = false) MarkNotificationReadRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        NotificationResponse response = notificationService.markAsRead(
                id,
                principal.getId(),
                request != null ? request.getIsRead() : null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Đánh dấu tất cả notification là đã đọc")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<NotificationReadAllResponse>> markAllAsRead(
            @RequestBody(required = false) MarkAllNotificationsReadRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        int updatedCount = notificationService.markAllAsRead(
                principal.getId(),
                request != null ? request.getIsRead() : null);

        NotificationReadAllResponse response = NotificationReadAllResponse.builder()
                .updatedCount(updatedCount)
                .build();
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", response));
    }

    @Operation(summary = "Xóa một notification của bản thân")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationDeleteResponse>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {

        notificationService.deleteNotification(id, principal.getId());
        NotificationDeleteResponse response = NotificationDeleteResponse.builder()
                .deleted(true)
                .build();
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", response));
    }
}
