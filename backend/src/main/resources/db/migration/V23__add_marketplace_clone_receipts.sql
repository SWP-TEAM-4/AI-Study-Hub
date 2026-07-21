CREATE TABLE marketplace_clone_receipts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    source_id BIGINT NOT NULL,
    cloned_resource_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_marketplace_clone_user_source UNIQUE (user_id, target_type, source_id),
    CONSTRAINT ck_marketplace_clone_target_type CHECK (target_type IN ('DOCUMENT', 'QUIZ'))
);

CREATE INDEX idx_marketplace_clone_receipt_resource
    ON marketplace_clone_receipts(target_type, cloned_resource_id);

-- Preserve historical clone credit without deleting any legacy duplicate resources.
INSERT INTO marketplace_clone_receipts (
    user_id,
    target_type,
    source_id,
    cloned_resource_id,
    created_at,
    updated_at
)
SELECT
    user_id,
    'DOCUMENT',
    cloned_from_id,
    MIN(id),
    MIN(created_at),
    CURRENT_TIMESTAMP
FROM documents
WHERE cloned_from_id IS NOT NULL
GROUP BY user_id, cloned_from_id
ON CONFLICT (user_id, target_type, source_id) DO NOTHING;

INSERT INTO marketplace_clone_receipts (
    user_id,
    target_type,
    source_id,
    cloned_resource_id,
    created_at,
    updated_at
)
SELECT
    creator_id,
    'QUIZ',
    cloned_from_id,
    MIN(id),
    MIN(created_at),
    CURRENT_TIMESTAMP
FROM quizzes
WHERE cloned_from_id IS NOT NULL
GROUP BY creator_id, cloned_from_id
ON CONFLICT (user_id, target_type, source_id) DO NOTHING;
