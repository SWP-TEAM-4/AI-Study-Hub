package com.aistudyhub.security;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.User;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owner: BE1
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Load user bằng email (Spring Security convention: username = email).
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return new CustomUserDetails(user);
    }

    /**
     * Load user bằng ID – dùng trong JwtAuthenticationFilter.
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return new CustomUserDetails(user);
    }
}
