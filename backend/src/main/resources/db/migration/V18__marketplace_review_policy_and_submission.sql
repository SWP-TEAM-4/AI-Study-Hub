CREATE TABLE IF NOT EXISTS subject_review_policies (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
    policy_mode VARCHAR(30) NOT NULL DEFAULT 'SINGLE_REVIEWER',
    required_votes INT NOT NULL DEFAULT 1 CHECK (required_votes >= 1),
    approval_percentage INT NOT NULL DEFAULT 100 CHECK (approval_percentage BETWEEN 1 AND 100),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_submissions (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    submission_round INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    policy_mode_snapshot VARCHAR(30) NOT NULL,
    required_votes_snapshot INT NOT NULL,
    approval_percentage_snapshot INT NOT NULL,
    submit_note TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,
    decided_by_id BIGINT REFERENCES users(id),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_marketplace_submission_round UNIQUE(target_type, target_id, submission_round)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_submission_status ON marketplace_submissions(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_submission_subject ON marketplace_submissions(subject_id);
ALTER TABLE market_reviews ADD COLUMN IF NOT EXISTS submission_id BIGINT REFERENCES marketplace_submissions(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS uk_market_review_submission_reviewer
    ON market_reviews(submission_id, reviewer_id) WHERE submission_id IS NOT NULL;

ALTER TABLE market_reviews ADD CONSTRAINT ck_market_review_one_target
    CHECK (num_nonnulls(document_id, quiz_id, flashcard_deck_id) = 1) NOT VALID;
ALTER TABLE content_reports ADD CONSTRAINT ck_content_report_one_target
    CHECK (num_nonnulls(document_id, quiz_id, flashcard_deck_id) = 1) NOT VALID;
