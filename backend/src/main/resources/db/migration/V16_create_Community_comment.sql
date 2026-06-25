CREATE TABLE community_comments (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id),

    document_id BIGINT REFERENCES documents(id),

    parent_comment_id BIGINT REFERENCES community_comments(id),

    content TEXT NOT NULL,

    hidden BOOLEAN NOT NULL DEFAULT FALSE,

    deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);