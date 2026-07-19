ALTER TABLE ai_usage_logs
    ALTER COLUMN estimated_cost TYPE DECIMAL(12,6);

ALTER TABLE ai_usage_logs
    DROP CONSTRAINT IF EXISTS ai_usage_logs_user_id_fkey;

ALTER TABLE ai_usage_logs
    ADD CONSTRAINT fk_ai_usage_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created_at
    ON ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_action_created_at
    ON ai_usage_logs(action_type, created_at DESC);
