-- Migration: Add submit_note column to documents, quizzes, and flashcard_decks tables to store submitter's note
ALTER TABLE documents ADD COLUMN IF NOT EXISTS submit_note TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS submit_note TEXT;
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS submit_note TEXT;
