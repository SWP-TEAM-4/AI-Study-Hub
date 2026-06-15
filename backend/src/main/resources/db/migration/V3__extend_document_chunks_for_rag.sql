ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS token_estimate INT;

ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS source_page INT;

ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS source_section VARCHAR(255);
