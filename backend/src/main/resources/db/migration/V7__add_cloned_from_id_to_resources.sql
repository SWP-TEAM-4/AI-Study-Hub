-- ============================================================
-- V7__add_cloned_from_id_to_resources.sql
-- Thêm cột cloned_from_id để lưu vết nguồn gốc của tài nguyên clone từ chợ
-- ============================================================

ALTER TABLE documents 
    ADD COLUMN cloned_from_id BIGINT REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE quizzes 
    ADD COLUMN cloned_from_id BIGINT REFERENCES quizzes(id) ON DELETE SET NULL;

ALTER TABLE flashcard_decks 
    ADD COLUMN cloned_from_id BIGINT REFERENCES flashcard_decks(id) ON DELETE SET NULL;
