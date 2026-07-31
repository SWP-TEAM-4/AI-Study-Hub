-- ============================================================
-- V30__document_safety_reviews.sql
-- Owner: BE1 - Document safety moderation review queue
-- ============================================================

CREATE TABLE IF NOT EXISTS document_safety_reviews (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    review_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    document_moderation_status VARCHAR(50) NOT NULL,
    violation_severity VARCHAR(50) NOT NULL DEFAULT 'NONE',
    category VARCHAR(100),
    confidence DECIMAL(5,4),
    policy_flags TEXT,
    reason TEXT,
    moderation_note TEXT,
    text_excerpt TEXT,
    reviewed_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_safety_reviews_status
    ON document_safety_reviews(review_status);

CREATE INDEX IF NOT EXISTS idx_document_safety_reviews_document
    ON document_safety_reviews(document_id);

CREATE INDEX IF NOT EXISTS idx_document_safety_reviews_owner
    ON document_safety_reviews(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_document_safety_reviews_created_at
    ON document_safety_reviews(created_at DESC);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'DOCUMENT_SAFETY_MODERATION_ENABLED',
       'true',
       'Enable Gemini document safety review during chunking and edited chunk review',
       FALSE
WHERE NOT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'DOCUMENT_SAFETY_MODERATION_ENABLED'
);
