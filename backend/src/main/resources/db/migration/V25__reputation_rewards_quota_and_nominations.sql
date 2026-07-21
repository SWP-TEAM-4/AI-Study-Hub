ALTER TABLE documents ADD COLUMN IF NOT EXISTS community_review_count INT NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS community_rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0;

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS community_review_count INT NOT NULL DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS community_rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0;

ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS community_review_count INT NOT NULL DEFAULT 0;
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS community_rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reward_rules (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(80) NOT NULL UNIQUE,
    points_delta INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_events_per_user_per_period INT,
    threshold_value INT,
    min_rating INT,
    max_rating INT,
    description TEXT,
    updated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reputation_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    event_type VARCHAR(80) NOT NULL,
    target_type VARCHAR(40),
    target_id BIGINT,
    source_type VARCHAR(80),
    source_id BIGINT,
    points_delta INT NOT NULL,
    reason TEXT,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    period_key VARCHAR(7) NOT NULL,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_user_period ON reputation_events(user_id, period_key);
CREATE INDEX IF NOT EXISTS idx_reputation_events_subject_period ON reputation_events(subject_id, period_key);
CREATE INDEX IF NOT EXISTS idx_reputation_events_event_type ON reputation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_source ON reputation_events(source_type, source_id);

CREATE TABLE IF NOT EXISTS ai_quota_tiers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    min_reputation_points INT NOT NULL UNIQUE,
    daily_chat_limit INT NOT NULL,
    monthly_chat_limit INT NOT NULL,
    daily_summary_limit INT NOT NULL,
    monthly_summary_limit INT NOT NULL,
    daily_generation_limit INT NOT NULL,
    monthly_generation_limit INT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_role_nominations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
    nomination_type VARCHAR(60) NOT NULL,
    role_type VARCHAR(100) NOT NULL,
    scope_type VARCHAR(100) NOT NULL,
    scope_id BIGINT,
    period_key VARCHAR(7) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    effective_start_at TIMESTAMP,
    effective_end_at TIMESTAMP,
    reviewed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_type, scope_type, scope_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_role_nomination_status ON community_role_nominations(status);
CREATE INDEX IF NOT EXISTS idx_role_nomination_subject_period ON community_role_nominations(subject_id, period_key);

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_APPROVED_DOCUMENT', 30, TRUE, 'Author reward when a document is approved for marketplace'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_APPROVED_DOCUMENT');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_APPROVED_QUIZ', 25, TRUE, 'Author reward when a quiz is approved for marketplace'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_APPROVED_QUIZ');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_APPROVED_FLASHCARD_DECK', 20, TRUE, 'Author reward when a flashcard deck is approved for marketplace'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_APPROVED_FLASHCARD_DECK');

INSERT INTO reward_rules (event_type, points_delta, enabled, max_events_per_user_per_period, description)
SELECT 'MARKETPLACE_CLONE_RECEIVED', 2, TRUE, 200, 'Creator reward for a unique user cloning marketplace content'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'MARKETPLACE_CLONE_RECEIVED');

INSERT INTO reward_rules (event_type, points_delta, enabled, threshold_value, description)
SELECT 'CONTENT_DOWNLOAD_MILESTONE', 20, TRUE, 50, 'Creator reward every N unique clone/download milestones'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_DOWNLOAD_MILESTONE');

INSERT INTO reward_rules (event_type, points_delta, enabled, min_rating, description)
SELECT 'COMMUNITY_REVIEW_GOOD', 10, TRUE, 4, 'Creator reward when community review rating is high'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'COMMUNITY_REVIEW_GOOD');

INSERT INTO reward_rules (event_type, points_delta, enabled, max_rating, description)
SELECT 'COMMUNITY_REVIEW_BAD', -10, TRUE, 2, 'Creator penalty when community review rating is low'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'COMMUNITY_REVIEW_BAD');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'REVIEWER_MARKETPLACE_VOTE', 5, TRUE, 'Reviewer reward for submitting a marketplace vote'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'REVIEWER_MARKETPLACE_VOTE');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'REVIEWER_DECISION_ALIGNED', 3, TRUE, 'Reviewer bonus when their vote matches final decision'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'REVIEWER_DECISION_ALIGNED');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_REPORT_ACCEPTED', 5, TRUE, 'Reporter reward when a report is resolved as valid'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_REPORT_ACCEPTED');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_REPORT_REJECTED', -5, TRUE, 'Reporter penalty when a report is rejected'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_REPORT_REJECTED');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_REPORT_OWNER_PENALTY', -20, TRUE, 'Owner penalty when a report against their content is resolved'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_REPORT_OWNER_PENALTY');

INSERT INTO reward_rules (event_type, points_delta, enabled, description)
SELECT 'CONTENT_HIDDEN_PENALTY', -30, TRUE, 'Owner penalty when content is hidden by admin/moderator'
WHERE NOT EXISTS (SELECT 1 FROM reward_rules WHERE event_type = 'CONTENT_HIDDEN_PENALTY');

INSERT INTO ai_quota_tiers (name, min_reputation_points, daily_chat_limit, monthly_chat_limit,
                            daily_summary_limit, monthly_summary_limit, daily_generation_limit,
                            monthly_generation_limit)
SELECT 'Starter', 0, 20, 600, 5, 150, 5, 150
WHERE NOT EXISTS (SELECT 1 FROM ai_quota_tiers WHERE min_reputation_points = 0);

INSERT INTO ai_quota_tiers (name, min_reputation_points, daily_chat_limit, monthly_chat_limit,
                            daily_summary_limit, monthly_summary_limit, daily_generation_limit,
                            monthly_generation_limit)
SELECT 'Contributor', 100, 40, 1200, 12, 360, 12, 360
WHERE NOT EXISTS (SELECT 1 FROM ai_quota_tiers WHERE min_reputation_points = 100);

INSERT INTO ai_quota_tiers (name, min_reputation_points, daily_chat_limit, monthly_chat_limit,
                            daily_summary_limit, monthly_summary_limit, daily_generation_limit,
                            monthly_generation_limit)
SELECT 'Trusted Contributor', 300, 80, 2400, 25, 750, 25, 750
WHERE NOT EXISTS (SELECT 1 FROM ai_quota_tiers WHERE min_reputation_points = 300);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'COMMUNITY_MODERATOR_NOMINATION_LIMIT_PER_SUBJECT', '1', 'Top N users per subject nominated for monthly Subject Moderator review', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'COMMUNITY_MODERATOR_NOMINATION_LIMIT_PER_SUBJECT');

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'COMMUNITY_REVIEWER_ELIGIBLE_POINTS', '100', 'Minimum reputation points before a user can be nominated as marketplace reviewer', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'COMMUNITY_REVIEWER_ELIGIBLE_POINTS');

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'COMMUNITY_REVIEWER_NOMINATION_LIMIT_PER_SUBJECT', '3', 'Top N eligible users per subject nominated for reviewer approval', FALSE
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'COMMUNITY_REVIEWER_NOMINATION_LIMIT_PER_SUBJECT');
