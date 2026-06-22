package com.aistudyhub.module.systemconfig.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.systemconfig.SystemConfigKeys;
import com.aistudyhub.module.systemconfig.dto.SystemConfigRequest;
import com.aistudyhub.module.systemconfig.dto.SystemConfigResponse;
import com.aistudyhub.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<SystemConfigResponse> listAll() {
        return systemConfigRepository.findAllByOrderByConfigKeyAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SystemConfigResponse> listPublic() {
        return systemConfigRepository.findAllByIsPublicTrueOrderByConfigKeyAsc().stream()
                .filter(config -> isPublicConfigKey(config.getConfigKey()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SystemConfigResponse create(SystemConfigRequest request, Long actorUserId) {
        String normalizedKey = normalizeKey(request.getConfigKey());
        validateCreateDuplicate(normalizedKey);

        SystemConfig config = SystemConfig.builder()
                .configKey(normalizedKey)
                .configValue(normalizeRequiredValue(request.getConfigValue()))
                .description(normalizeNullable(request.getDescription()))
                .isPublic(isPublicConfigKey(normalizedKey))
                .build();

        SystemConfig saved = systemConfigRepository.save(config);
        log.info("Created system config id={} key={}", saved.getId(), saved.getConfigKey());
        logConfigMutation(actorUserId, saved, "CREATE");
        return toResponse(saved);
    }

    @Transactional
    public SystemConfigResponse update(Long id, SystemConfigRequest request, Long actorUserId) {
        SystemConfig config = findByIdOrThrow(id);
        String normalizedKey = normalizeKey(request.getConfigKey());
        validateUpdateDuplicate(normalizedKey, id);

        config.setConfigKey(normalizedKey);
        config.setConfigValue(normalizeRequiredValue(request.getConfigValue()));
        config.setDescription(normalizeNullable(request.getDescription()));
        config.setPublic(isPublicConfigKey(normalizedKey));

        SystemConfig saved = systemConfigRepository.save(config);
        log.info("Updated system config id={} key={}", saved.getId(), saved.getConfigKey());
        logConfigMutation(actorUserId, saved, "UPDATE");
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id, Long actorUserId) {
        SystemConfig config = findByIdOrThrow(id);
        systemConfigRepository.delete(config);
        log.info("Deleted system config id={} key={}", config.getId(), config.getConfigKey());
        logConfigMutation(actorUserId, config, "DELETE");
    }

    @Transactional(readOnly = true)
    public String getValueByKey(String configKey) {
        String normalizedKey = normalizeKey(configKey);
        return systemConfigRepository.findByConfigKey(normalizedKey)
                .map(SystemConfig::getConfigValue)
                .orElseThrow(() -> new AppException(
                        ErrorCode.SYSTEM_CONFIG_NOT_FOUND,
                        "System config not found for key: " + normalizedKey));
    }

    @Transactional(readOnly = true)
    public int getIntValueOrDefault(String configKey, int defaultValue) {
        String normalizedKey = normalizeKey(configKey);
        return systemConfigRepository.findByConfigKey(normalizedKey)
                .map(SystemConfig::getConfigValue)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(value -> parseIntOrDefault(normalizedKey, value, defaultValue))
                .orElseGet(() -> {
                    log.warn("System config key={} not found. Using default value={}", normalizedKey, defaultValue);
                    return defaultValue;
                });
    }

    private SystemConfig findByIdOrThrow(Long id) {
        return systemConfigRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND));
    }

    private void validateCreateDuplicate(String normalizedKey) {
        if (systemConfigRepository.existsByConfigKey(normalizedKey)) {
            throw new AppException(ErrorCode.SYSTEM_CONFIG_KEY_DUPLICATE);
        }
    }

    private void validateUpdateDuplicate(String normalizedKey, Long id) {
        if (systemConfigRepository.existsByConfigKeyAndIdNot(normalizedKey, id)) {
            throw new AppException(ErrorCode.SYSTEM_CONFIG_KEY_DUPLICATE);
        }
    }

    private String normalizeKey(String value) {
        if (!StringUtils.hasText(value)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Config key is required");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRequiredValue(String value) {
        if (!StringUtils.hasText(value)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Config value is required");
        }
        return value.trim();
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean isPublicConfigKey(String normalizedKey) {
        return SystemConfigKeys.PUBLIC_KEYS.contains(normalizedKey);
    }

    private int parseIntOrDefault(String normalizedKey, String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            log.warn("System config key={} has invalid integer value='{}'. Using default value={}",
                    normalizedKey, value, defaultValue);
            return defaultValue;
        }
    }

    private SystemConfigResponse toResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .id(config.getId())
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .build();
    }

    private void logConfigMutation(Long actorUserId, SystemConfig config, String operation) {
        LinkedHashMap<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("operation", operation);
        metadata.put("configKey", config.getConfigKey());
        metadata.put("isPublic", config.isPublic());
        activityLogService.log(
                actorUserId,
                ActivityActionType.UPDATE_SYSTEM_CONFIG,
                ActivityTargetType.SYSTEM_CONFIG,
                config.getId(),
                metadata,
                config.getConfigKey(),
                operation);
    }
}
