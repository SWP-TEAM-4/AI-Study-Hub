-- ============================================================
-- V12__normalize_system_config_keys_for_be049.sql
-- Owner: BE1 – Compatibility cleanup for BE-049
-- ============================================================

UPDATE system_configs
SET config_key = 'MAX_UPLOAD_FILE_SIZE_BYTES'
WHERE config_key = 'MAX_UPLOAD_SIZE_MB'
  AND NOT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'MAX_UPLOAD_FILE_SIZE_BYTES'
);

UPDATE system_configs
SET is_public = TRUE
WHERE config_key IN (
    'MAX_UPLOAD_FILE_SIZE_BYTES',
    'ALLOWED_FILE_TYPES',
    'FREE_DOWNLOAD_WAIT_SECONDS',
    'AI_CHAT_DAILY_LIMIT',
    'AI_SUMMARY_DAILY_LIMIT'
);
