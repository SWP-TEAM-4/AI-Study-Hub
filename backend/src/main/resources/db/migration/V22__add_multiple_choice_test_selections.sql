CREATE TABLE user_quiz_progress_selected_options (
    progress_id BIGINT NOT NULL REFERENCES user_quiz_progress(id) ON DELETE CASCADE,
    option_id   BIGINT NOT NULL REFERENCES quiz_options(id),
    PRIMARY KEY (progress_id, option_id)
);

CREATE INDEX idx_user_quiz_progress_selected_options_option
    ON user_quiz_progress_selected_options(option_id);
