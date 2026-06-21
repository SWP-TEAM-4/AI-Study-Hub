package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Owner: BE1 – Storage configuration (local / Supabase Storage)
 * <p>
 * Để chuyển sang Supabase: set STORAGE_TYPE=supabase trong môi trường hoặc application.yml
 */
@Getter
@Configuration
public class StorageConfig {

    // ── Storage type ──────────────────────────────────────────────────────────

    @Value("${app.storage.type:local}")
    private String storageType;

    // ── Local Storage ─────────────────────────────────────────────────────────

    @Value("${app.storage.local-path:./uploads}")
    private String localStoragePath;

    @Value("${app.storage.base-url:http://localhost:8080/files}")
    private String baseUrl;

    // ── Supabase Storage ──────────────────────────────────────────────────────

    @Value("${app.supabase.url:https://your-project.supabase.co}")
    private String supabaseUrl;

    @Value("${app.supabase.service-role-key:}")
    private String supabaseServiceRoleKey;

    @Value("${app.supabase.storage-bucket:documents}")
    private String supabaseStorageBucket;

    // ── Helpers ───────────────────────────────────────────────────────────────

    public boolean isLocal() {
        return "local".equalsIgnoreCase(storageType);
    }

    public boolean isSupabase() {
        return "supabase".equalsIgnoreCase(storageType);
    }
}
