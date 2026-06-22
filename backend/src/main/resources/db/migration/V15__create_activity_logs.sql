CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id BIGINT,
    metadata JSONB,
    search_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_actor_user_id ON activity_logs(actor_user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_target_type_target_id ON activity_logs(target_type, target_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
