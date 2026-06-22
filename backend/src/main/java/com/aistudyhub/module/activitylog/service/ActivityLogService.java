package com.aistudyhub.module.activitylog.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.entity.ActivityLog;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.activitylog.dto.ActivityLogResponse;
import com.aistudyhub.repository.ActivityLogRepository;
import com.aistudyhub.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ActivityLogService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate requiresNewTransaction;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                              UserRepository userRepository,
                              ObjectMapper objectMapper,
                              PlatformTransactionManager transactionManager) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.requiresNewTransaction = new TransactionTemplate(transactionManager);
        this.requiresNewTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void log(Long actorUserId,
                    ActivityActionType action,
                    ActivityTargetType targetType,
                    Long targetId) {
        log(actorUserId, action, targetType, targetId, null);
    }

    public void log(Long actorUserId,
                    ActivityActionType action,
                    ActivityTargetType targetType,
                    Long targetId,
                    Object metadata,
                    String... searchTerms) {
        if (actorUserId == null || action == null || targetType == null) {
            return;
        }

        try {
            requiresNewTransaction.executeWithoutResult(status -> {
                User actorUser = userRepository.findById(actorUserId).orElse(null);
                if (actorUser == null) {
                    log.warn("Skip activity log because actor user {} does not exist", actorUserId);
                    return;
                }

                ActivityLog activityLog = ActivityLog.builder()
                        .actorUser(actorUser)
                        .action(action)
                        .targetType(targetType)
                        .targetId(targetId)
                        .metadata(toMetadataNode(metadata))
                        .searchText(buildSearchText(action, targetType, searchTerms))
                        .build();

                activityLogRepository.save(activityLog);
            });
        } catch (Exception ex) {
            log.warn("Failed to write activity log action={} actorUserId={} targetType={} targetId={}",
                    action, actorUserId, targetType, targetId, ex);
        }
    }

    @Transactional(readOnly = true)
    public PaginationResponse<ActivityLogResponse> getAdminLogs(String keyword, int page, int size, String sort) {
        Page<ActivityLogResponse> result = activityLogRepository.findAll(
                        buildFilterSpec(keyword, null),
                        PageRequest.of(normalizePage(page), normalizeSize(size), buildSort(sort)))
                .map(this::toResponse);
        return PaginationResponse.of(result);
    }

    @Transactional(readOnly = true)
    public PaginationResponse<ActivityLogResponse> getMyLogs(Long actorUserId, String keyword, int page, int size,
                                                             String sort) {
        Page<ActivityLogResponse> result = activityLogRepository.findAll(
                        buildFilterSpec(keyword, actorUserId),
                        PageRequest.of(normalizePage(page), normalizeSize(size), buildSort(sort)))
                .map(this::toResponse);
        return PaginationResponse.of(result);
    }

    private Specification<ActivityLog> buildFilterSpec(String keyword, Long actorUserId) {
        return Specification.where(hasActorUserId(actorUserId))
                .and(hasKeyword(keyword));
    }

    private Specification<ActivityLog> hasActorUserId(Long actorUserId) {
        return (root, query, cb) -> actorUserId == null
                ? cb.conjunction()
                : cb.equal(root.get("actorUser").get("id"), actorUserId);
    }

    private Specification<ActivityLog> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return cb.conjunction();
            }
            String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            return cb.like(cb.lower(root.get("searchText")), pattern);
        };
    }

    private int normalizePage(int page) {
        return Math.max(page, DEFAULT_PAGE);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private Sort buildSort(String sort) {
        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, "createdAt");
    }

    private JsonNode toMetadataNode(Object metadata) {
        if (metadata == null) {
            return null;
        }
        JsonNode node = objectMapper.valueToTree(metadata);
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isObject() && node.isEmpty()) {
            return null;
        }
        return node;
    }

    private String buildSearchText(ActivityActionType action, ActivityTargetType targetType, String... searchTerms) {
        return Arrays.stream(searchTerms == null ? new String[0] : searchTerms)
                .filter(StringUtils::hasText)
                .map(term -> term.trim().toLowerCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .collect(Collectors.collectingAndThen(Collectors.toList(), values -> {
                    values.add(action.name().toLowerCase(Locale.ROOT));
                    values.add(targetType.name().toLowerCase(Locale.ROOT));
                    return values.stream()
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.joining(" "));
                }));
    }

    private ActivityLogResponse toResponse(ActivityLog activityLog) {
        return ActivityLogResponse.builder()
                .id(activityLog.getId())
                .actorId(activityLog.getActorUser().getId())
                .action(activityLog.getAction())
                .targetType(activityLog.getTargetType())
                .targetId(activityLog.getTargetId())
                .metadata(activityLog.getMetadata())
                .createdAt(activityLog.getCreatedAt())
                .build();
    }
}
