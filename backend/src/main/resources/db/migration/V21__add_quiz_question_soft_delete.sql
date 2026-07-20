ALTER TABLE quiz_questions
    ADD COLUMN deleted_at TIMESTAMP NULL;

CREATE INDEX idx_quiz_questions_active_by_quiz
    ON quiz_questions (quiz_id)
    WHERE deleted_at IS NULL;
