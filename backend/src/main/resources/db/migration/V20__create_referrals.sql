-- ============================================================
-- V20__create_referrals.sql
-- Owner: BE3 - BE-052 Referral/Growth
-- ============================================================

CREATE TABLE referrals (
    id                  BIGSERIAL PRIMARY KEY,
    owner_user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code                VARCHAR(50) NOT NULL UNIQUE,
    applied_referral_id BIGINT      REFERENCES referrals(id) ON DELETE SET NULL,
    applied_by_user_id  BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    reward_points       INT         NOT NULL DEFAULT 0,
    applied_at          TIMESTAMP,
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_referrals_owner_user UNIQUE (owner_user_id),
    CONSTRAINT chk_referrals_status CHECK (status IN ('ACTIVE', 'APPLIED'))
);

CREATE INDEX idx_referrals_owner_user ON referrals(owner_user_id);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_applied_referral ON referrals(applied_referral_id);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'GROWTH_REFERRAL_REWARD_POINTS', '20', 'Reputation points awarded to both users when a referral code is applied', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'GROWTH_REFERRAL_REWARD_POINTS'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'GROWTH_TOP_CONTRIBUTOR_LIMIT', '10', 'Top N contributor leaderboard users that receive the Top Contributor badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'GROWTH_TOP_CONTRIBUTOR_LIMIT'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'GROWTH_REFERRAL_AMBASSADOR_INVITES', '5', 'Successful referrals required for the Referral Ambassador badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'GROWTH_REFERRAL_AMBASSADOR_INVITES'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS', '3', 'Approved marketplace contents required for the Marketplace Contributor badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REWARD_POPULAR_CREATOR_DOWNLOADS', '50', 'Total marketplace downloads required for the Popular Creator badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'REWARD_POPULAR_CREATOR_DOWNLOADS'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REWARD_TOP_REVIEWER_REVIEWS', '10', 'Completed marketplace reviews required for the Top Reviewer badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'REWARD_TOP_REVIEWER_REVIEWS'
);

INSERT INTO system_configs (config_key, config_value, description, is_public)
SELECT 'REWARD_REPUTATION_MILESTONE_POINTS', '100', 'Reputation points required for the Reputation Milestone badge', FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_configs WHERE config_key = 'REWARD_REPUTATION_MILESTONE_POINTS'
);

INSERT INTO badges (name, description, icon_url)
SELECT 'Top Contributor', 'Awarded automatically to users in the top contributor leaderboard.', '/badges/top-contributor.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Top Contributor'));

INSERT INTO badges (name, description, icon_url)
SELECT 'First Approved Content', 'Awarded automatically after a user''s first approved marketplace content.', '/badges/first-approved-content.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('First Approved Content'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Marketplace Contributor', 'Awarded automatically after contributing multiple approved marketplace items.', '/badges/marketplace-contributor.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Marketplace Contributor'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Popular Creator', 'Awarded automatically when a user''s marketplace content reaches a download milestone.', '/badges/popular-creator.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Popular Creator'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Top Reviewer', 'Awarded automatically after completing a marketplace review milestone.', '/badges/top-reviewer.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Top Reviewer'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Referral Starter', 'Awarded automatically after applying a valid referral code.', '/badges/referral-starter.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Referral Starter'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Referral Ambassador', 'Awarded automatically after inviting enough users with a referral code.', '/badges/referral-ambassador.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Referral Ambassador'));

INSERT INTO badges (name, description, icon_url)
SELECT 'Reputation Milestone', 'Awarded automatically after reaching the configured reputation milestone.', '/badges/reputation-milestone.svg'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE LOWER(name) = LOWER('Reputation Milestone'));
