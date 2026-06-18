-- Clear all CASE data (test/demo cases) so you can work with real Vadodara cases.
-- Keeps the statute corpus (statute_chunks), the judgment seed (judgments_cache),
-- and the append-only audit_log (immutable by design — it outlives the records it
-- describes, which is the whole point of an audit trail).
--
-- Run once the DB is up:
--   docker compose exec -T db psql -U crimegpt -d crimegpt < db/reset_cases.sql

TRUNCATE TABLE
    cases,
    case_facts,
    suggested_sections,
    suggested_judgments,
    documents,
    case_diary,
    evidence
RESTART IDENTITY CASCADE;
