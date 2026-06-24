-- Migration: Add admin_note and resolved_by_id to content_reports table
-- Owner: BE3 (Task BE-045)

ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolved_by_id BIGINT REFERENCES users(id);
