ALTER TABLE marketplace_clone_receipts
    DROP CONSTRAINT IF EXISTS ck_marketplace_clone_target_type;

ALTER TABLE marketplace_clone_receipts
    ADD CONSTRAINT ck_marketplace_clone_target_type
        CHECK (target_type IN ('DOCUMENT', 'QUIZ', 'FLASHCARD_DECK'));

-- Preserve historical clone credit without deleting legacy duplicate decks.
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
    'FLASHCARD_DECK',
    cloned_from_id,
    MIN(id),
    MIN(created_at),
    CURRENT_TIMESTAMP
FROM flashcard_decks
WHERE cloned_from_id IS NOT NULL
GROUP BY user_id, cloned_from_id
ON CONFLICT (user_id, target_type, source_id) DO NOTHING;
