-- ============================================================
-- V8__create table ai_usage_logs.sql
-- Dùng để thống kê người dùng đã sử dụng AI
-- ============================================================
Create table ai_usage_logs(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    token_count INT,
    estimated_cost DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)