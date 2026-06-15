-- CrimeGPT schema (Kanad S.H.I.E.L.D. 2026, PS-69EEFDFB90B99)
-- Postgres 16 + pgvector. All legal references are BNS / BNSS / BSA only.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. cases — top-level case record, holds the raw FIR narrative
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number   TEXT UNIQUE,
    status        TEXT NOT NULL DEFAULT 'new',   -- new | analyzed | review_required | documented
    fir_narrative TEXT NOT NULL,
    analysis_confidence NUMERIC(4,3),             -- overall confidence from the last analyze run
    validation_concerns JSONB,                    -- validator concerns from the last analyze run
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. case_facts — structured facts extracted by the extraction agent.
--    One row per case (editable JSON blob), traceable via updated_at.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_facts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
    facts       JSONB NOT NULL,                 -- {complainant, accused[], victims[], items[], events[], location, dates[]}
    source      TEXT NOT NULL DEFAULT 'extraction_agent',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. suggested_sections — classification-agent output, validated downstream
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suggested_sections (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id          UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    code             TEXT NOT NULL,             -- BNS | BNSS | BSA
    section_no       TEXT NOT NULL,
    heading          TEXT,
    old_code_ref     TEXT,                      -- cross-ref to repealed IPC/CrPC/IEA (PS requirement)
    confidence       NUMERIC(4,3) NOT NULL DEFAULT 0,
    rationale        TEXT,
    statute_chunk_id UUID,                      -- traceback to retrieved statute text
    validated        BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (code IN ('BNS', 'BNSS', 'BSA'))
);

-- ---------------------------------------------------------------------------
-- 4. suggested_judgments — Indian Kanoon judgment suggestions (cache-backed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suggested_judgments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id           UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    indiankanoon_doc_id TEXT NOT NULL,
    title             TEXT,
    relevance         NUMERIC(4,3) NOT NULL DEFAULT 0,
    tags              TEXT[],
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. documents — generated .docx + integrity metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id       UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,               -- chargesheet | remand_request | seizure_receipt
    file_path     TEXT NOT NULL,
    sha256        TEXT NOT NULL,
    s63_cert_path TEXT,                         -- BSA Section 63 Part-A certificate
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. case_diary — automated investigative timeline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_diary (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,                 -- fir_filed | analyzed | document_generated | ...
    description TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. audit_log — APPEND-ONLY. UPDATE/DELETE blocked by trigger below.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID,
    doc_id      UUID,
    action      TEXT NOT NULL,                 -- e.g. case.create, facts.update, document.generate
    actor       TEXT NOT NULL DEFAULT 'system',
    before      JSONB,
    after       JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only enforcement: any UPDATE or DELETE on audit_log raises an error.
CREATE OR REPLACE FUNCTION audit_log_block_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

-- Row-level triggers do NOT fire on TRUNCATE, so block it at statement level too.
DROP TRIGGER IF EXISTS audit_log_no_truncate ON audit_log;
CREATE TRIGGER audit_log_no_truncate
    BEFORE TRUNCATE ON audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_mutation();

-- NOTE (production hardening): the table owner can still DISABLE/DROP these
-- triggers. For a genuine tamper-evident claim, run the application as a
-- non-owner role granted only INSERT, SELECT on audit_log:
--   CREATE ROLE crimegpt_app LOGIN PASSWORD '...';
--   REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM crimegpt_app;
--   GRANT INSERT, SELECT ON audit_log TO crimegpt_app;
-- and keep table ownership with a separate migration role.

-- ---------------------------------------------------------------------------
-- 8. statute_chunks — RAG corpus: BNS/BNSS/BSA bare-act text + embeddings
--    embedding dim 384 (sentence-transformers/all-MiniLM-L6-v2 sized).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS statute_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT NOT NULL,                -- BNS | BNSS | BSA
    section_no   TEXT NOT NULL,
    heading      TEXT,
    text         TEXT NOT NULL,
    old_code_ref TEXT,                         -- repealed IPC/CrPC/IEA equivalent (cross-reference)
    keywords     TEXT,                         -- plain-language trigger terms for keyword recall
    embedding    vector(384),                  -- populate to switch to semantic retrieval
    CHECK (code IN ('BNS', 'BNSS', 'BSA'))
);

CREATE INDEX IF NOT EXISTS statute_chunks_embedding_idx
    ON statute_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- 9. judgments_cache — Indian Kanoon results cached for offline/demo use
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS judgments_cache (
    indiankanoon_doc_id TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    summary     TEXT,
    tags        TEXT[],
    embedding   vector(384),
    cached_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful lookup indexes
CREATE INDEX IF NOT EXISTS suggested_sections_case_idx ON suggested_sections(case_id);
CREATE INDEX IF NOT EXISTS documents_case_idx ON documents(case_id);
CREATE INDEX IF NOT EXISTS case_diary_case_idx ON case_diary(case_id);
CREATE INDEX IF NOT EXISTS audit_log_case_idx ON audit_log(case_id);
