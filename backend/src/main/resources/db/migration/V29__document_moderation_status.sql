-- ============================================================
-- V29__document_moderation_status.sql
-- Owner: BE1 – Document safety moderation gate
-- ============================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS violation_severity VARCHAR(50) NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS moderation_note TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_documents_moderation_status
    ON documents(moderation_status);

UPDATE documents
SET moderation_status = 'SAFE',
    violation_severity = 'NONE',
    moderated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE processing_status = 'SUCCESS'
  AND moderation_status = 'PENDING';
