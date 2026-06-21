package com.aistudyhub.module.notification.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.Notification;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.notification.dto.NotificationResponse;
import com.aistudyhub.module.notification.service.NotificationService;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.NotificationRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE034Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CommunityRoleRepository communityRoleRepository;

    @Autowired
    private NotificationService notificationService;

    private User admin;
    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        communityRoleRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        currentUser = userRepository.save(User.builder()
                .email("student1@fpt.edu.vn")
                .fullName("Current User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("student2@fpt.edu.vn")
                .fullName("Other User")
                .role(Role.STUDENT)
                .isActive(true)
                .build());
    }

    @Test
    void getMyNotifications_ReturnsOnlyCurrentUserNotifications_WithNewestSort() throws Exception {
        Notification older = saveNotification(currentUser, "Old notification", "Older content", false);
        Notification newer = saveNotification(currentUser, "New notification", "Newer content", false);
        saveNotification(otherUser, "Other notification", "Should not appear", false);

        mockMvc.perform(get("/api/notifications")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.items[0].id").value(newer.getId()))
                .andExpect(jsonPath("$.data.items[1].id").value(older.getId()))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void getMyNotifications_FiltersByKeyword() throws Exception {
        saveNotification(currentUser, "Document approved", "Marketplace review completed", false);
        saveNotification(currentUser, "Weekly digest", "Nothing related here", false);

        mockMvc.perform(get("/api/notifications")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .param("keyword", "approved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].title").value("Document approved"));
    }

    @Test
    void markAsRead_Success_ForOwnedNotification() throws Exception {
        Notification notification = saveNotification(currentUser, "Unread notification", "Please read", false);

        mockMvc.perform(patch("/api/notifications/{id}/read", notification.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isRead": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(notification.getId()))
                .andExpect(jsonPath("$.data.isRead").value(true));

        Notification updated = notificationRepository.findById(notification.getId()).orElseThrow();
        assertTrue(updated.getIsRead());
    }

    @Test
    void markAsRead_ReturnsNotFound_ForOtherUsersNotification() throws Exception {
        Notification notification = saveNotification(otherUser, "Private notification", "Not yours", false);

        mockMvc.perform(patch("/api/notifications/{id}/read", notification.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isRead": true
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("NOTIFICATION_NOT_FOUND"));
    }

    @Test
    void markAllAsRead_UpdatesOnlyUnreadNotificationsOfCurrentUser() throws Exception {
        saveNotification(currentUser, "Unread 1", "A", false);
        saveNotification(currentUser, "Unread 2", "B", false);
        saveNotification(currentUser, "Already read", "C", true);
        saveNotification(otherUser, "Other user unread", "D", false);

        mockMvc.perform(patch("/api/notifications/read-all")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "isRead": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("All notifications marked as read"))
                .andExpect(jsonPath("$.data.updatedCount").value(2));

        assertEquals(0L, notificationRepository.countByUserIdAndIsReadFalse(currentUser.getId()));
        assertEquals(1L, notificationRepository.countByUserIdAndIsReadFalse(otherUser.getId()));
    }

    @Test
    void deleteNotification_Success_ForOwnedNotification() throws Exception {
        Notification notification = saveNotification(currentUser, "Delete me", "Body", false);

        mockMvc.perform(delete("/api/notifications/{id}", notification.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Deleted successfully"))
                .andExpect(jsonPath("$.data.deleted").value(true));

        assertFalse(notificationRepository.findById(notification.getId()).isPresent());
    }

    @Test
    void createNotification_ServiceCreatesNotification() {
        NotificationResponse response = notificationService.createNotification(
                currentUser.getId(),
                "Service notification",
                "Created from service");

        assertEquals(currentUser.getId(), response.getUserId());
        assertEquals("Service notification", response.getTitle());
        assertFalse(response.getIsRead());
    }

    @Test
    void grantCommunityRole_CreatesNotificationForTargetUser() throws Exception {
        mockMvc.perform(post("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "roleType": "REVIEWER"
                                }
                                """.formatted(currentUser.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(currentUser.getId(), PageRequest.of(0, 10))
                .getContent();

        assertEquals(1, notifications.size());
        assertEquals("Community role granted", notifications.get(0).getTitle());
        assertTrue(notifications.get(0).getContent().contains("REVIEWER"));
    }

    private Notification saveNotification(User user, String title, String content, boolean isRead) {
        return notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .isRead(isRead)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
