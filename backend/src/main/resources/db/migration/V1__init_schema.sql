-- ============================================================
-- V1__init_schema.sql
-- Owner: BE1 – Schema gốc của toàn hệ thống
-- ĐÃ CHẠY: KHÔNG ĐƯỢC SỬA – tạo V2+ cho thay đổi mới
-- ============================================================

-- ==========================
-- MODULE: ACADEMIC MASTER DATA
-- ==========================

CREATE TABLE semesters (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(50)  NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE combos (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(50)  NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    id                       BIGSERIAL PRIMARY KEY,
    code                     VARCHAR(50)  NOT NULL UNIQUE,
    name                     VARCHAR(255) NOT NULL,
    standard_semester_number INT,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE combo_subjects (
    id         BIGSERIAL PRIMARY KEY,
    combo_id   BIGINT NOT NULL REFERENCES combos(id)   ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (combo_id, subject_id)
);

-- ==========================
-- MODULE: USERS & AUTH
-- ==========================

CREATE TABLE users (
    id                   BIGSERIAL PRIMARY KEY,
    google_id            VARCHAR(255),
    type                 VARCHAR(50),
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255),
    full_name            VARCHAR(255) NOT NULL,
    avatar_url           VARCHAR(500),
    current_semester_id  BIGINT REFERENCES semesters(id) ON DELETE SET NULL,
    combo_id             BIGINT REFERENCES combos(id)    ON DELETE SET NULL,
    role                 VARCHAR(50)  NOT NULL DEFAULT 'STUDENT',
    reputation_points    INT          NOT NULL DEFAULT 0,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);

CREATE TABLE password_resets (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reset_token  VARCHAR(255) NOT NULL UNIQUE,
    expired_at   TIMESTAMP    NOT NULL
);

CREATE INDEX idx_password_resets_token ON password_resets(reset_token);

-- ==========================
-- MODULE: NOTIFICATIONS & SYSTEM
-- ==========================

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    content     TEXT,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

CREATE TABLE system_feedbacks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT,
    screen_url  VARCHAR(500),
    status      VARCHAR(50)  DEFAULT 'PENDING',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_configs (
    id           BIGSERIAL PRIMARY KEY,
    config_key   VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description  VARCHAR(500)
);

-- ==========================
-- MODULE: REWARDS & BADGES
-- ==========================

CREATE TABLE badges (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url    VARCHAR(500),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id    BIGINT NOT NULL REFERENCES badges(id),
    earned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_id)
);

-- ==========================
-- MODULE: COMMUNITY ROLES
-- ==========================

CREATE TABLE community_roles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by_user_id  BIGINT       REFERENCES users(id),
    role_type           VARCHAR(100) NOT NULL,
    scope_type          VARCHAR(100),
    scope_id            BIGINT,
    start_at            TIMESTAMP,
    end_at              TIMESTAMP,
    status              VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_community_roles_user   ON community_roles(user_id);
CREATE INDEX idx_community_roles_status ON community_roles(status);

-- ==========================
-- MODULE: NOTEBOOKS & LEARNING
-- ==========================

CREATE TABLE notebooks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id  BIGINT       NOT NULL REFERENCES subjects(id),
    title       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notebooks_user    ON notebooks(user_id);
CREATE INDEX idx_notebooks_subject ON notebooks(subject_id);

CREATE TABLE chat_sessions (
    id          BIGSERIAL PRIMARY KEY,
    notebook_id BIGINT       NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_sequence INT    NOT NULL,
    sender_role      VARCHAR(50) NOT NULL,   -- USER / AI
    content          TEXT        NOT NULL,
    cited_sources    TEXT,                   -- JSON array of {documentId, chunkIndex}
    created_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, message_sequence);

-- ==========================
-- MODULE: DOCUMENTS
-- ==========================

CREATE TABLE tags (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE,
    type  VARCHAR(50),
    color VARCHAR(20)
);

CREATE TABLE documents (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id),
    subject_id        BIGINT       REFERENCES subjects(id),
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    file_url          VARCHAR(500),
    cloud_file_path   VARCHAR(500),
    file_type         VARCHAR(50),
    file_size         BIGINT,
    visibility        VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    market_status     VARCHAR(50)  NOT NULL DEFAULT 'NONE',
    download_count    INT          NOT NULL DEFAULT 0,
    review_count      INT          NOT NULL DEFAULT 0,
    accept_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    ai_verdict_note   TEXT,
    processing_status VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user       ON documents(user_id);
CREATE INDEX idx_documents_subject    ON documents(subject_id);
CREATE INDEX idx_documents_visibility ON documents(visibility, market_status);

CREATE TABLE notebook_documents (
    id           BIGSERIAL PRIMARY KEY,
    notebook_id  BIGINT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    document_id  BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE (notebook_id, document_id)
);

CREATE TABLE document_chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_id  BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  INT    NOT NULL,
    text_content TEXT   NOT NULL,
    vector_id    VARCHAR(255),
    UNIQUE (document_id, chunk_index)
);

CREATE TABLE document_tags (
    id          BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags(id),
    UNIQUE (document_id, tag_id)
);

-- ==========================
-- MODULE: QUIZ & TEST
-- ==========================

CREATE TABLE quizzes (
    id                BIGSERIAL PRIMARY KEY,
    notebook_id       BIGINT       REFERENCES notebooks(id) ON DELETE SET NULL,
    subject_id        BIGINT       REFERENCES subjects(id),
    creator_id        BIGINT       NOT NULL REFERENCES users(id),
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    academic_term_id  BIGINT       REFERENCES semesters(id),
    exam_type         VARCHAR(100),
    visibility        VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    market_status     VARCHAR(50)  NOT NULL DEFAULT 'NONE',
    download_count    INT          NOT NULL DEFAULT 0,
    review_count      INT          NOT NULL DEFAULT 0,
    accept_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    ai_verdict_note   TEXT,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_creator ON quizzes(creator_id);

CREATE TABLE quiz_questions (
    id            BIGSERIAL PRIMARY KEY,
    quiz_id       BIGINT       NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT         NOT NULL,
    question_type VARCHAR(50)  NOT NULL,
    explanation   TEXT
);

CREATE TABLE quiz_options (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT  NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT    NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE tests (
    id          BIGSERIAL PRIMARY KEY,
    quiz_id     BIGINT       NOT NULL REFERENCES quizzes(id),
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    title       VARCHAR(255),
    total_score DECIMAL(5,2),
    duration    INT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'IN_PROGRESS',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_user ON tests(user_id);

CREATE TABLE user_quiz_progress (
    id                 BIGSERIAL PRIMARY KEY,
    test_id            BIGINT  NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_id        BIGINT  NOT NULL REFERENCES quiz_questions(id),
    selected_option_id BIGINT  REFERENCES quiz_options(id),
    user_answer_text   TEXT,
    is_correct         BOOLEAN,
    answered_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (test_id, question_id)
);

-- ==========================
-- MODULE: FLASHCARD
-- ==========================

CREATE TABLE flashcard_decks (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id),
    notebook_id       BIGINT       REFERENCES notebooks(id) ON DELETE SET NULL,
    subject_id        BIGINT       REFERENCES subjects(id),
    title             VARCHAR(255) NOT NULL,
    visibility        VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    market_status     VARCHAR(50)  NOT NULL DEFAULT 'NONE',
    download_count    INT          NOT NULL DEFAULT 0,
    review_count      INT          NOT NULL DEFAULT 0,
    accept_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    ai_verdict_note   TEXT,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcard_decks_user ON flashcard_decks(user_id);

CREATE TABLE flashcards (
    id         BIGSERIAL PRIMARY KEY,
    deck_id    BIGINT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front_text TEXT   NOT NULL,
    back_text  TEXT   NOT NULL
);

CREATE TABLE user_flashcard_progress (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id  BIGINT    NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    box_level     INT       NOT NULL DEFAULT 1,
    last_reviewed TIMESTAMP,
    UNIQUE (user_id, flashcard_id)
);

-- ==========================
-- MODULE: GOVERNANCE / MARKETPLACE
-- ==========================

CREATE TABLE market_reviews (
    id               BIGSERIAL PRIMARY KEY,
    reviewer_id      BIGINT       NOT NULL REFERENCES users(id),
    document_id      BIGINT       REFERENCES documents(id)      ON DELETE CASCADE,
    quiz_id          BIGINT       REFERENCES quizzes(id)         ON DELETE CASCADE,
    flashcard_deck_id BIGINT      REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    vote_result      VARCHAR(50),   -- ACCEPT / REJECT
    rating           INT,           -- 1–5 stars
    review_note      TEXT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_reports (
    id                BIGSERIAL PRIMARY KEY,
    reporter_id       BIGINT       NOT NULL REFERENCES users(id),
    document_id       BIGINT       REFERENCES documents(id),
    quiz_id           BIGINT       REFERENCES quizzes(id),
    flashcard_deck_id BIGINT       REFERENCES flashcard_decks(id),
    reason_type       VARCHAR(100) NOT NULL,
    report_details    TEXT,
    severity_level    VARCHAR(50)  DEFAULT 'LOW',
    status            VARCHAR(50)  NOT NULL DEFAULT 'PENDING_ADMIN',
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_reports_status ON content_reports(status);
