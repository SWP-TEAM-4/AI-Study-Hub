package com.aistudyhub.module.systemconfig;

import java.util.Set;

/**
 * Canonical system config keys dùng chung giữa các module.
 */
public final class SystemConfigKeys {

    public static final String MAX_UPLOAD_FILE_SIZE_BYTES = "MAX_UPLOAD_FILE_SIZE_BYTES";
    public static final String ALLOWED_FILE_TYPES = "ALLOWED_FILE_TYPES";
    public static final String BASE_REPUTATION_PER_UPLOAD = "BASE_REPUTATION_PER_UPLOAD";
    public static final String MARKETPLACE_AUTO_APPROVE_MIN_REVIEWS = "MARKETPLACE_AUTO_APPROVE_MIN_REVIEWS";
    public static final String MARKETPLACE_AUTO_APPROVE_ACCEPT_PERCENTAGE =
            "MARKETPLACE_AUTO_APPROVE_ACCEPT_PERCENTAGE";
    public static final String FREE_DOWNLOAD_WAIT_SECONDS = "FREE_DOWNLOAD_WAIT_SECONDS";
    public static final String PRO_COMMISSION_PERCENTAGE = "PRO_COMMISSION_PERCENTAGE";
    public static final String AI_CHAT_DAILY_LIMIT = "AI_CHAT_DAILY_LIMIT";
    public static final String AI_SUMMARY_DAILY_LIMIT = "AI_SUMMARY_DAILY_LIMIT";
    public static final String RESET_TOKEN_EXPIRE_MINUTES = "RESET_TOKEN_EXPIRE_MINUTES";

    public static final Set<String> PUBLIC_KEYS = Set.of(
            MAX_UPLOAD_FILE_SIZE_BYTES,
            ALLOWED_FILE_TYPES,
            FREE_DOWNLOAD_WAIT_SECONDS,
            AI_CHAT_DAILY_LIMIT,
            AI_SUMMARY_DAILY_LIMIT
    );

    private SystemConfigKeys() {
    }
}
