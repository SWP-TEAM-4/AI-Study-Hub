-- ============================================================
-- V27__registration_email_verification.sql
-- Owner: BE1 – Registration email verification
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

CREATE TABLE IF NOT EXISTS registration_verifications (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verification_code VARCHAR(255) NOT NULL,
    expired_at        TIMESTAMP    NOT NULL,
    verified_at       TIMESTAMP,
    attempt_count     INT          NOT NULL DEFAULT 0,
    last_sent_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registration_verifications_user
    ON registration_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_registration_verifications_expired_at
    ON registration_verifications(expired_at);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REGISTRATION_VERIFICATION_EXPIRE_MINUTES',
       '10',
       'Registration verification code expiry in minutes',
       FALSE
WHERE NOT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'REGISTRATION_VERIFICATION_EXPIRE_MINUTES'
);
