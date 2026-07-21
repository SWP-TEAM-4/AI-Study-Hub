CREATE TABLE IF NOT EXISTS marketplace_clone_receipts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(40) NOT NULL,
    source_id BIGINT NOT NULL,
    cloned_resource_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_marketplace_clone_receipts_user_target_source
        UNIQUE (user_id, target_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_clone_receipts_user
    ON marketplace_clone_receipts(user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_clone_receipts_target
    ON marketplace_clone_receipts(target_type, source_id);
