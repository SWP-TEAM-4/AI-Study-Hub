package com.aistudyhub.security;

import com.aistudyhub.common.enums.CommunityRoleStatus;
import com.aistudyhub.common.enums.CommunityRoleType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.CommunityRoleRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Owner: BE1
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final Set<CommunityRoleType> REVIEWER_AUTHORITY_ROLE_TYPES = Set.of(
            CommunityRoleType.REVIEWER,
            CommunityRoleType.MARKETPLACE_REVIEWER);

    private final UserRepository userRepository;
    private final CommunityRoleRepository communityRoleRepository;

    /**
     * Load user bằng email (Spring Security convention: username = email).
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return new CustomUserDetails(user, buildAuthorities(user));
    }

    /**
     * Load user bằng ID – dùng trong JwtAuthenticationFilter.
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return new CustomUserDetails(user, buildAuthorities(user));
    }

    private Set<GrantedAuthority> buildAuthorities(User user) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        boolean hasReviewerPermission = communityRoleRepository.existsAnyActiveRoleByUserIdAndRoleTypes(
                user.getId(),
                REVIEWER_AUTHORITY_ROLE_TYPES,
                CommunityRoleStatus.ACTIVE,
                LocalDateTime.now());

        if (hasReviewerPermission) {
            authorities.add(new SimpleGrantedAuthority("ROLE_REVIEWER"));
        }

        return authorities;
    }
}
