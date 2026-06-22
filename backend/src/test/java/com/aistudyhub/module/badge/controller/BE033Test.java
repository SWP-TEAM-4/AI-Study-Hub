package com.aistudyhub.module.badge.controller;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.Badge;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserBadge;
import com.aistudyhub.repository.BadgeRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE033Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private UserBadgeRepository userBadgeRepository;

    private User admin;
    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        userBadgeRepository.deleteAll();
        badgeRepository.deleteAll();
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
    void createBadge_Success_ForAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/badges")
                        .with(user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "First Upload",
                                  "description": "Uploaded first approved content",
                                  "iconUrl": "/badges/first-upload.svg"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.name").value("First Upload"))
                .andExpect(jsonPath("$.data.description").value("Uploaded first approved content"))
                .andExpect(jsonPath("$.data.iconUrl").value("/badges/first-upload.svg"));

        assertEquals(1L, badgeRepository.count());
    }

    @Test
    void createBadge_Forbidden_ForStudent() throws Exception {
        mockMvc.perform(post("/api/admin/badges")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(currentUser)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "First Upload"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    void getAllBadges_ReturnsNewestFirst() throws Exception {
        Badge older = saveBadge("First Upload", "Uploaded first approved content", "/badges/first-upload.svg");
        Badge newer = saveBadge("Top Reviewer", "Reviewed many items", "/badges/top-reviewer.svg");

        mockMvc.perform(get("/api/badges")
                        .with(user(userDetails(currentUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(newer.getId()))
                .andExpect(jsonPath("$.data[1].id").value(older.getId()));
    }

    @Test
    void assignBadge_Success_ForAdmin() throws Exception {
        Badge badge = saveBadge("First Upload", "Uploaded first approved content", "/badges/first-upload.svg");

        mockMvc.perform(post("/api/admin/users/{userId}/badges/{badgeId}", currentUser.getId(), badge.getId())
                        .with(user(userDetails(admin))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(badge.getId()))
                .andExpect(jsonPath("$.data.name").value("First Upload"));

        assertTrue(userBadgeRepository.existsByUser_IdAndBadge_Id(currentUser.getId(), badge.getId()));
    }

    @Test
    void assignBadge_ReturnsConflict_WhenDuplicateExists() throws Exception {
        Badge badge = saveBadge("First Upload", "Uploaded first approved content", "/badges/first-upload.svg");
        saveUserBadge(currentUser, badge);

        mockMvc.perform(post("/api/admin/users/{userId}/badges/{badgeId}", currentUser.getId(), badge.getId())
                        .with(user(userDetails(admin))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("BADGE_ALREADY_ASSIGNED"));
    }

    @Test
    void assignBadge_ReturnsNotFound_WhenBadgeDoesNotExist() throws Exception {
        mockMvc.perform(post("/api/admin/users/{userId}/badges/{badgeId}", currentUser.getId(), 99999L)
                        .with(user(userDetails(admin))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("BADGE_NOT_FOUND"));
    }

    @Test
    void assignBadge_ReturnsNotFound_WhenUserDoesNotExist() throws Exception {
        Badge badge = saveBadge("First Upload", "Uploaded first approved content", "/badges/first-upload.svg");

        mockMvc.perform(post("/api/admin/users/{userId}/badges/{badgeId}", 99999L, badge.getId())
                        .with(user(userDetails(admin))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("USER_NOT_FOUND"));
    }

    @Test
    void getMyBadges_ReturnsOnlyCurrentUserBadges_InEarnedOrder() throws Exception {
        Badge firstBadge = saveBadge("First Upload", "Uploaded first approved content", "/badges/first-upload.svg");
        saveUserBadge(currentUser, firstBadge);

        Badge secondBadge = saveBadge("Top Reviewer", "Reviewed many items", "/badges/top-reviewer.svg");
        saveUserBadge(currentUser, secondBadge);

        Badge otherUsersBadge = saveBadge("Marketplace Helper", "Helped the community", "/badges/helper.svg");
        saveUserBadge(otherUser, otherUsersBadge);

        mockMvc.perform(get("/api/users/me/badges")
                        .with(user(userDetails(currentUser))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(secondBadge.getId()))
                .andExpect(jsonPath("$.data[1].id").value(firstBadge.getId()));
    }

    private Badge saveBadge(String name, String description, String iconUrl) {
        return badgeRepository.save(Badge.builder()
                .name(name)
                .description(description)
                .iconUrl(iconUrl)
                .build());
    }

    private UserBadge saveUserBadge(User user, Badge badge) {
        return userBadgeRepository.save(UserBadge.builder()
                .user(user)
                .badge(badge)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
