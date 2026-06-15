ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS embedding_vector TEXT;

ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);
