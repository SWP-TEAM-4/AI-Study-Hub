package com.aistudyhub.module.badge.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Badge;
import com.aistudyhub.entity.User;
import com.aistudyhub.entity.UserBadge;
import com.aistudyhub.module.badge.dto.BadgeRequest;
import com.aistudyhub.module.badge.dto.BadgeResponse;
import com.aistudyhub.repository.BadgeRepository;
import com.aistudyhub.repository.UserBadgeRepository;
import com.aistudyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    @Transactional
    public BadgeResponse createBadge(BadgeRequest request) {
        Badge badge = Badge.builder()
                .name(request.getName().trim())
                .description(trimToNull(request.getDescription()))
                .iconUrl(trimToNull(request.getIconUrl()))
                .build();

        Badge saved = badgeRepository.save(badge);
        log.info("Created badge id={} name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> getAllBadges() {
        return badgeRepository.findAllByOrderByCreatedAtDescIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BadgeResponse assignBadgeToUser(Long userId, Long badgeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new AppException(ErrorCode.BADGE_NOT_FOUND));

        if (userBadgeRepository.existsByUser_IdAndBadge_Id(userId, badgeId)) {
            throw new AppException(ErrorCode.BADGE_ALREADY_ASSIGNED);
        }

        try {
            userBadgeRepository.save(UserBadge.builder()
                    .user(user)
                    .badge(badge)
                    .build());
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(ErrorCode.BADGE_ALREADY_ASSIGNED);
        }

        log.info("Assigned badge id={} to userId={}", badgeId, userId);
        return toResponse(badge);
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> getUserBadges(Long userId) {
        return userBadgeRepository.findAllByUser_IdOrderByEarnedAtDescIdDesc(userId)
                .stream()
                .map(UserBadge::getBadge)
                .map(this::toResponse)
                .toList();
    }

    private BadgeResponse toResponse(Badge badge) {
        return BadgeResponse.builder()
                .id(badge.getId())
                .name(badge.getName())
                .description(badge.getDescription())
                .iconUrl(badge.getIconUrl())
                .createdAt(badge.getCreatedAt())
                .build();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
