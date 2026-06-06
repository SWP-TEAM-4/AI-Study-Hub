package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Owner: BE2 – Storage configuration (local/cloud)
 */
@Getter
@Configuration
public class StorageConfig {

    @Value("${app.storage.type:local}")
    private String storageType;

    @Value("${app.storage.local-path:./uploads}")
    private String localStoragePath;

    @Value("${app.storage.base-url:http://localhost:8080/files}")
    private String baseUrl;

    public boolean isLocal() {
        return "local".equalsIgnoreCase(storageType);
    }
}
