-- ============================================================
-- V31__chat_session_admin_governance.sql
-- Owner: BE1 - Admin preview governance for notebook chat sessions
-- ============================================================

ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_access_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reported_to_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_report_reason TEXT,
    ADD COLUMN IF NOT EXISTS admin_reported_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_admin_governance
    ON chat_sessions(reported_to_admin, admin_access_allowed, is_private);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created_at
    ON chat_sessions(user_id, created_at DESC);
