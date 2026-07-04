-- Runs on the postgres container the first time it starts.
-- Creates the pgvector extension so the JPA @Entity's `update` DDL
-- and the native queries in SemanticCacheRepository can use `vector`.

CREATE EXTENSION IF NOT EXISTS vector;

-- Create the table explicitly (Hibernate's ddl-auto=update will
-- add missing columns to matching-name entities, but it does not
-- know how to create the `embedding vector(1536)` column type. So
-- we create the whole table here.)
CREATE TABLE IF NOT EXISTS semantic_cache (
    id BIGSERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding vector(1536)
);

-- IVFFlat index for approximate nearest neighbour search on cosine
-- distance. For a demo dataset this is optional (sequential scan is
-- fast at small row counts), but it's what a real deployment would
-- have, and having it here means the SQL in the repository already
-- uses the right operator (<=>) that the index knows how to serve.
CREATE INDEX IF NOT EXISTS semantic_cache_embedding_idx
    ON semantic_cache
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
