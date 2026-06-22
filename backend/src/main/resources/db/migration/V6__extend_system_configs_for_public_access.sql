-- ============================================================
-- V6__extend_system_configs_for_public_access.sql
-- Owner: BE1 – Extend system configs for BE-049
-- ============================================================

ALTER TABLE system_configs
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE system_configs
SET config_key = 'MARKETPLACE_AUTO_APPROVE_ACCEPT_PERCENTAGE'
WHERE config_key = 'MARKETPLACE_AUTO_APPROVE_ACCEPT_PCT';

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'PRO_COMMISSION_PERCENTAGE', '10', 'Platform commission percentage for Pro marketplace', FALSE
WHERE NOT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'PRO_COMMISSION_PERCENTAGE'
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
