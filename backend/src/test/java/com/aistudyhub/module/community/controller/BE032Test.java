package com.aistudyhub.module.community.controller;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.enums.CommunityScopeType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.CommunityRole;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.community.service.CommunityPermissionService;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.aistudyhub.security.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BE032Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CommunityRoleRepository communityRoleRepository;

    @Autowired
    private CommunityPermissionService communityPermissionService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    private User admin;
    private User reviewerCandidate;
    private User otherUser;
    private Subject subjectA;
    private Subject subjectB;

    @BeforeEach
    void setUp() {
        communityRoleRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(User.builder()
                .email("admin@aistudyhub.com")
                .fullName("System Admin")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        reviewerCandidate = userRepository.save(User.builder()
                .email("reviewer@fpt.edu.vn")
                .fullName("Reviewer Candidate")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@fpt.edu.vn")
                .fullName("Other Student")
                .role(Role.STUDENT)
                .isActive(true)
                .build());

        subjectA = subjectRepository.save(Subject.builder()
                .code("SWR302")
                .name("Software Requirements")
                .standardSemesterNumber(4)
                .build());

        subjectB = subjectRepository.save(Subject.builder()
                .code("SWP391")
                .name("Application Development Project")
                .standardSemesterNumber(5)
                .build());
    }

    @Test
    void grantRole_Success_WithSubjectScope() throws Exception {
        LocalDateTime startAt = LocalDateTime.now().minusHours(1);
        LocalDateTime endAt = LocalDateTime.now().plusDays(30);

        String requestBody = """
                {
                  "userId": %d,
                  "roleType": "MARKETPLACE_REVIEWER",
                  "scopeType": "SUBJECT",
                  "scopeId": %d,
                  "startAt": "%s",
                  "endAt": "%s"
                }
                """.formatted(reviewerCandidate.getId(), subjectA.getId(), startAt, endAt);

        mockMvc.perform(post("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.userId").value(reviewerCandidate.getId()))
                .andExpect(jsonPath("$.data.grantedByUserId").value(admin.getId()))
                .andExpect(jsonPath("$.data.roleType").value("MARKETPLACE_REVIEWER"))
                .andExpect(jsonPath("$.data.scopeType").value("SUBJECT"))
                .andExpect(jsonPath("$.data.scopeId").value(subjectA.getId()))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        assertEquals(1L, communityRoleRepository.count());
    }

    @Test
    void grantRole_Forbidden_ForNonAdmin() throws Exception {
        String requestBody = """
                {
                  "userId": %d,
                  "roleType": "MARKETPLACE_REVIEWER",
                  "scopeType": "SUBJECT",
                  "scopeId": %d
                }
                """.formatted(reviewerCandidate.getId(), subjectA.getId());

        mockMvc.perform(post("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(reviewerCandidate)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    void grantRole_ValidationError_WhenGlobalScopeHasScopeId() throws Exception {
        String requestBody = """
                {
                  "userId": %d,
                  "roleType": "REVIEWER",
                  "scopeType": "GLOBAL",
                  "scopeId": %d
                }
                """.formatted(reviewerCandidate.getId(), subjectA.getId());

        mockMvc.perform(post("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("scopeId must be null when scopeType is GLOBAL"))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void grantRole_Conflict_WhenActiveDuplicateExists() throws Exception {
        saveRole(reviewerCandidate, admin, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT,
                subjectA.getId(), LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(7),
                CommunityRoleStatus.ACTIVE);

        String requestBody = """
                {
                  "userId": %d,
                  "roleType": "MARKETPLACE_REVIEWER",
                  "scopeType": "SUBJECT",
                  "scopeId": %d
                }
                """.formatted(reviewerCandidate.getId(), subjectA.getId());

        mockMvc.perform(post("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMUNITY_ROLE_ALREADY_ACTIVE"));
    }

    @Test
    void getMyRoles_ReturnsOnlyCurrentRoles() throws Exception {
        saveRole(reviewerCandidate, admin, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT,
                subjectA.getId(), LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(10),
                CommunityRoleStatus.ACTIVE);

        saveRole(reviewerCandidate, admin, CommunityRoleType.CONTENT_MODERATOR, CommunityScopeType.SUBJECT,
                subjectB.getId(), LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(1),
                CommunityRoleStatus.ACTIVE);

        saveRole(reviewerCandidate, admin, CommunityRoleType.SUBJECT_MODERATOR, CommunityScopeType.SUBJECT,
                subjectB.getId(), LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(10),
                CommunityRoleStatus.REVOKED);

        mockMvc.perform(get("/api/community-roles/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(reviewerCandidate))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].roleType").value("MARKETPLACE_REVIEWER"))
                .andExpect(jsonPath("$.data[0].scopeId").value(subjectA.getId()));
    }

    @Test
    void adminListRoles_ReturnsPagedData() throws Exception {
        saveRole(reviewerCandidate, admin, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT,
                subjectA.getId(), LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(7),
                CommunityRoleStatus.ACTIVE);
        saveRole(otherUser, admin, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL,
                null, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(7),
                CommunityRoleStatus.ACTIVE);

        mockMvc.perform(get("/api/admin/community-roles")
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "newest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    void revokeRole_Success_ChangesStatus() throws Exception {
        CommunityRole role = saveRole(reviewerCandidate, admin, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL,
                null, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30),
                CommunityRoleStatus.ACTIVE);

        String requestBody = """
                {
                  "reason": "Role expired or no longer needed"
                }
                """;

        mockMvc.perform(patch("/api/admin/community-roles/{id}/revoke", role.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(userDetails(admin)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(role.getId()))
                .andExpect(jsonPath("$.data.status").value("REVOKED"));

        CommunityRole updated = communityRoleRepository.findById(role.getId()).orElseThrow();
        assertEquals(CommunityRoleStatus.REVOKED, updated.getStatus());
    }

    @Test
    void permissionHelper_RespectsScope() {
        saveRole(reviewerCandidate, admin, CommunityRoleType.MARKETPLACE_REVIEWER, CommunityScopeType.SUBJECT,
                subjectA.getId(), LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(3),
                CommunityRoleStatus.ACTIVE);

        assertTrue(communityPermissionService.hasReviewerPermission(
                reviewerCandidate.getId(), CommunityScopeType.SUBJECT, subjectA.getId()));
        assertFalse(communityPermissionService.hasReviewerPermission(
                reviewerCandidate.getId(), CommunityScopeType.SUBJECT, subjectB.getId()));
        assertFalse(communityPermissionService.hasReviewerPermission(
                otherUser.getId(), CommunityScopeType.SUBJECT, subjectA.getId()));
    }

    @Test
    void customUserDetailsService_AddsReviewerAuthority_FromCommunityRole() {
        saveRole(reviewerCandidate, admin, CommunityRoleType.REVIEWER, CommunityScopeType.GLOBAL,
                null, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(3),
                CommunityRoleStatus.ACTIVE);

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserById(reviewerCandidate.getId());
        Set<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        assertTrue(authorities.contains("ROLE_STUDENT"));
        assertTrue(authorities.contains("ROLE_REVIEWER"));
    }

    private CommunityRole saveRole(User user,
            User grantedBy,
            CommunityRoleType roleType,
            CommunityScopeType scopeType,
            Long scopeId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            CommunityRoleStatus status) {
        return communityRoleRepository.save(CommunityRole.builder()
                .user(user)
                .grantedBy(grantedBy)
                .roleType(roleType)
                .scopeType(scopeType)
                .scopeId(scopeId)
                .startAt(startAt)
                .endAt(endAt)
                .status(status)
                .build());
    }

    private CustomUserDetails userDetails(User user) {
        return new CustomUserDetails(user);
    }
}
