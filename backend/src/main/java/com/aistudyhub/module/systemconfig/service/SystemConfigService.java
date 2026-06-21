package com.aistudyhub.module.systemconfig.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.SystemConfig;
import com.aistudyhub.module.systemconfig.dto.SystemConfigRequest;
import com.aistudyhub.module.systemconfig.dto.SystemConfigResponse;
import com.aistudyhub.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    @Transactional(readOnly = true)
    public List<SystemConfigResponse> listAll() {
        return systemConfigRepository.findAllByOrderByConfigKeyAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SystemConfigResponse create(SystemConfigRequest request) {
        String normalizedKey = normalizeKey(request.getConfigKey());
        validateCreateDuplicate(normalizedKey);

        SystemConfig config = SystemConfig.builder()
                .configKey(normalizedKey)
                .configValue(normalizeRequiredValue(request.getConfigValue()))
                .description(normalizeNullable(request.getDescription()))
                .build();

        SystemConfig saved = systemConfigRepository.save(config);
        log.info("Created system config id={} key={}", saved.getId(), saved.getConfigKey());
        return toResponse(saved);
    }

    @Transactional
    public SystemConfigResponse update(Long id, SystemConfigRequest request) {
        SystemConfig config = findByIdOrThrow(id);
        String normalizedKey = normalizeKey(request.getConfigKey());
        validateUpdateDuplicate(normalizedKey, id);

        config.setConfigKey(normalizedKey);
        config.setConfigValue(normalizeRequiredValue(request.getConfigValue()));
        config.setDescription(normalizeNullable(request.getDescription()));

        SystemConfig saved = systemConfigRepository.save(config);
        log.info("Updated system config id={} key={}", saved.getId(), saved.getConfigKey());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        SystemConfig config = findByIdOrThrow(id);
        systemConfigRepository.delete(config);
        log.info("Deleted system config id={} key={}", config.getId(), config.getConfigKey());
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

    private SystemConfigResponse toResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .id(config.getId())
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .build();
    }
}
