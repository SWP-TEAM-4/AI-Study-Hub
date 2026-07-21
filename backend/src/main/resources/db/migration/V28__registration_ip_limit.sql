-- ============================================================
-- V28__registration_ip_limit.sql
-- Owner: BE1 – Limit registration spam by client IP
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);

CREATE INDEX IF NOT EXISTS idx_users_registration_ip ON users(registration_ip);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REGISTRATION_MAX_ACCOUNTS_PER_IP',
       '3',
       'Maximum number of accounts allowed from the same registration IP',
       FALSE
WHERE NOT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'REGISTRATION_MAX_ACCOUNTS_PER_IP'
);
