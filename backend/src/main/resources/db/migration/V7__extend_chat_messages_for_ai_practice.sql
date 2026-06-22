ALTER TABLE chat_messages
ADD COLUMN message_type VARCHAR(50) NOT NULL DEFAULT 'TEXT',
ADD COLUMN practice_type VARCHAR(30),
ADD COLUMN generated_payload JSONB,
ADD COLUMN validation_errors JSONB,
ADD COLUMN practice_status VARCHAR(30) NOT NULL DEFAULT 'NONE',
ADD COLUMN imported_target_type VARCHAR(30),
ADD COLUMN imported_target_id BIGINT,
ADD COLUMN imported_at TIMESTAMP;
