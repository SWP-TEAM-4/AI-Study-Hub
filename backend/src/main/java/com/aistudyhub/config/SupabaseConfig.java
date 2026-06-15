package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Supabase Storage integration.
 * <p>
 * Owner: BE1 – RAG Core (BE-016)
 * <p>
 * Supabase Storage is used for secure cloud file storage of uploaded documents.
 * Files are organized in buckets with proper authentication and access control.
 */
@Getter
@Configuration
public class SupabaseConfig {

    /**
     * Supabase project URL.
     * Format: https://{project-ref}.supabase.co
     * Must be provided via application.yml: app.supabase.url
     */
    @Value("${app.supabase.url:}")
    private String url;

    /**
     * Supabase service role key for server-side authentication.
     * This bypasses Row Level Security (RLS) - use carefully.
     * Must be provided via application.yml: app.supabase.service-role-key
     * <p>
     * SECURITY NOTE: Never expose this key in client-side code or logs.
     */
    @Value("${app.supabase.service-role-key:}")
    private String serviceRoleKey;

    /**
     * Storage bucket name for document files.
     * Default: documents
     */
    @Value("${app.supabase.storage-bucket:documents}")
    private String storageBucket;

    /**
     * Request timeout in seconds for Supabase API calls.
     * Default: 30 seconds
     */
    @Value("${app.supabase.timeout:30}")
    private int timeout;

    /**
     * Maximum retry attempts for failed Supabase API calls.
     * Default: 3 attempts
     */
    @Value("${app.supabase.max-retries:3}")
    private int maxRetries;

    /**
     * Get the Storage API base URL.
     * Format: {url}/storage/v1
     *
     * @return Storage API base URL
     */
    public String getStorageApiUrl() {
        return url + "/storage/v1";
    }

    /**
     * Get the object upload URL for a specific path.
     * Format: {url}/storage/v1/object/{bucket}/{path}
     *
     * @param path File path within the bucket
     * @return Complete upload URL
     */
    public String getUploadUrl(String path) {
        return String.format("%s/object/%s/%s", getStorageApiUrl(), storageBucket, path);
    }

    /**
     * Get the public URL for accessing a file.
     * Format: {url}/storage/v1/object/public/{bucket}/{path}
     *
     * @param path File path within the bucket
     * @return Public access URL
     */
    public String getPublicUrl(String path) {
        return String.format("%s/object/public/%s/%s", getStorageApiUrl(), storageBucket, path);
    }

    /**
     * Get the download URL for a private file (requires auth).
     * Format: {url}/storage/v1/object/{bucket}/{path}
     *
     * @param path File path within the bucket
     * @return Authenticated download URL
     */
    public String getDownloadUrl(String path) {
        return String.format("%s/object/%s/%s", getStorageApiUrl(), storageBucket, path);
    }
}
