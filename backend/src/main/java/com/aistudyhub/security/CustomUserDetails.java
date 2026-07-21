package com.aistudyhub.security;

import com.aistudyhub.common.enums.Role;
import com.aistudyhub.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Owner: BE1
 * Adapter giữa entity User và Spring Security UserDetails.
 */
@Getter
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final Role role;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this(user, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
    }

    public CustomUserDetails(User user, Collection<? extends GrantedAuthority> authorities) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.role = user.getRole();
        this.active = Boolean.TRUE.equals(user.getIsActive()) && Boolean.TRUE.equals(user.getEmailVerified());
        this.authorities = List.copyOf(authorities);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    /** username = email trong hệ thống này */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
