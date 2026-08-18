# CrimeGPT Backend

FastAPI backend for **CrimeGPT** (PS-69EEFDFB90B99, Kanad S.H.I.E.L.D. 2026).
Ingests an FIR narrative and runs a 4-agent anti-hallucination pipeline:

```
FIR narrative → extraction → classification (RAG over BNS/BNSS/BSA) →
validation (confidence) → document generation (.docx) → SHA-256 + BSA s.63
certificate + append-only audit log + case diary
```

Charging sections come from the codes **in force**: the **BNS** plus the special
acts that create the offences real FIRs are charged under — **PC Act, IT Act, NDPS,
Arms Act, POCSO**. Repealed IPC/CrPC/IEA provisions appear **only** as the
`old_code_ref` cross-reference, never as a charge.
The React frontend is built by a separate team — see **API_CONTRACT.md**.

## Tech

FastAPI (async) · PostgreSQL + pgvector · Groq (model set by `GROQ_MODEL`) · docxtpl/python-docx · hashlib (SHA-256)

## Prerequisites

- Python 3.11+
- Docker + Docker Compose (for Postgres + pgvector)
- A Groq API key (https://console.groq.com)

## Setup

```bash
cd backend

# 1. Config
cp .env.example .env
#   edit .env -> set GROQ_API_KEY

# 2. Start Postgres + pgvector (schema.sql + seed.sql auto-applied on first boot)
docker compose up -d
#   wait for healthy: docker compose ps

# 3. (only if the DB volume already existed) re-load the demo RAG corpus
#    docker compose exec -T db psql -U crimegpt -d crimegpt < db/seed.sql

# 3a. Special-act offence corpus (PC Act / IT Act / NDPS / Arms Act / POCSO).
#     REQUIRED — without it, a bribery or narcotics FIR classifies to zero sections.
#     Idempotent, so safe to run against an existing database.
docker compose exec -T db psql -U crimegpt -d crimegpt < db/special_acts.sql

# 4. Python env + deps
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 5. (optional) enable semantic retrieval — backfill statute embeddings once.
#    Skip this and retrieval falls back to keyword search automatically.
python -m scripts.embed_statutes

# 6. Run the API
uvicorn app.main:app --reload --port 8000

# 7. Pre-demo regression check — runs the 13-scenario classifier pre-test.
#    Exits non-zero on any FAIL. Run this before every demo.
python -m scripts.run_scenarios

# 8. Check both LLM providers respond and support JSON mode (cheap — a few
#    hundred tokens). Run after setting NVIDIA_API_KEY.
python -m scripts.check_providers

# 9. Automated test suite — document generation, evidence integrity, RBAC and
#    the append-only audit log. Needs the Postgres container up; costs no LLM
#    tokens (it never calls /analyze).
pytest
```

### Tests

`pytest` (from `backend/`) runs `tests/`, which pins the four claims the pitch
makes: all 8 document types generate a real `.docx` + SHA-256 + s.63 certificate;
the recorded hash is re-computed from the bytes on disk and must match; a
Legal Advisor is 403'd on every write endpoint while IO/SHO are not; and the
`audit_log` triggers reject UPDATE and DELETE over a raw connection.

The suite talks to the real database (that is where the triggers and version
history live) and **deliberately never calls the LLM** — analyzed state is seeded
with direct INSERTs, so a test run cannot eat the 200k/day Groq quota. Cases it
creates are prefixed `TEST-` and deleted at teardown; their `audit_log` rows are
not, because the append-only trigger blocks that. That is the expected result,
not a leak.

`scripts/run_scenarios.py` is separate and still required before a demo — it
pre-tests classifier *accuracy* and does spend tokens.

## LLM providers & the quota trap

Groq is primary (chosen for latency — it matters live). Its free tier is **200,000
tokens/day**, roughly 25-40 analyses; exhausting it mid-demo drops the pipeline to
the curated keyword mapping, which suggests sections but extracts **no facts**. The
giveaway is a result showing exactly **70% confidence with empty facts** — 0.70 is
the fallback constant, so that combination means the AI never ran.

Set `NVIDIA_API_KEY` (https://build.nvidia.com — OpenAI-compatible) and a Groq quota
429 fails over to NVIDIA instead of degrading. Verify with `scripts/check_providers`
before trusting it: the pipeline depends on JSON-mode output, and support varies by
model. If a provider rejects `response_format`, the client retries without it — the
required JSON Schema is injected into the system prompt either way.

Open http://localhost:8000/docs for interactive Swagger.

## Demo flow (matches the README demo path)

```bash
# create a case
curl -s -X POST localhost:8000/cases \
  -H 'content-type: application/json' \
  -d '{"fir_narrative":"On 12 June 2026 two unknown persons broke the lock of the complainant Ramesh Patel'\''s shop in Ahmedabad and stole a laptop and Rs 45000 cash. CCTV footage is available."}'

# run the 4-agent pipeline (needs GROQ_API_KEY)
curl -s -X POST localhost:8000/cases/<CASE_ID>/analyze

# generate documents (.docx + SHA-256 + s.63 cert)
curl -s -X POST localhost:8000/cases/<CASE_ID>/documents -H 'content-type: application/json' -d '{"type":"chargesheet"}'
curl -s -X POST localhost:8000/cases/<CASE_ID>/documents -H 'content-type: application/json' -d '{"type":"remand_request"}'

# view the case diary timeline
curl -s localhost:8000/cases/<CASE_ID>/diary
```

Generated `.docx` files + s.63 certificates land in `./artifacts/`.

## Layout

```
backend/
├── app/
│   ├── main.py            FastAPI app + all endpoints
│   ├── config.py          env-driven settings
│   ├── db.py              asyncpg pool
│   ├── models.py          Pydantic request/response + pipeline schemas
│   ├── audit.py           append-only audit-log writer
│   ├── integrity.py       SHA-256 + BSA s.63 certificate drafting
│   ├── documents.py       stage-4 .docx generation (8 doc types)
│   ├── rbac.py            role-based access (IO / SHO / Legal Advisor)
│   ├── mocks.py           mock CCTNS / BharatPol
│   └── pipeline/
│       ├── llm.py         Groq client, JSON-schema-constrained output
│       ├── retrieval.py   RAG interface (pgvector semantic + keyword fallback)
│       ├── fallback.py    curated crime→BNS safety-net
│       └── agents.py      4-stage pipeline + orchestrator
├── db/
│   ├── schema.sql         tables + append-only trigger + pgvector
│   └── seed.sql           demo BNS/BNSS/BSA corpus + judgment cache
├── scripts/
│   └── embed_statutes.py  one-time embedding backfill (semantic retrieval)
├── tests/                 pytest suite (documents, integrity, RBAC, audit log)
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── API_CONTRACT.md        ← frontend handoff document
```

## Notes / scope

- **Retrieval is semantic (pgvector) with a keyword fallback.** `retrieval.embed()`
  encodes the query with a 384-dim `fastembed` model (`all-MiniLM-L6-v2` on ONNX —
  no PyTorch, matching `statute_chunks.embedding vector(384)`) and
  `retrieve_statutes()` runs the cosine-distance query in `_vector_search`. If the
  model isn't installed, or the `embedding` column hasn't been backfilled yet,
  retrieval **transparently falls back** to OR full-text search over
  heading + statute text + a per-section `keywords` column (e.g. `upi otp phishing`
  → BNS 318). The keyword layer is deterministic and pre-tests 10/10 on the
  scenarios in `../test-scenarios.md`, so the app works with or without embeddings.
  - **Enable semantic search:** `pip install -r requirements.txt` (pulls
    `fastembed`, a lightweight ONNX runtime — ~150 MB, no CUDA/torch), then backfill
    embeddings once: `python -m scripts.embed_statutes` (re-run with `--all` to
    re-embed). The agent code never changes — only the retrieved chunks improve.
  - **Curated fallback safety-net (separate from retrieval):** if the LLM pipeline
    returns no validated section, `pipeline/fallback.py` supplies sections from a
    source-verified crime→BNS mapping so analysis never dead-ends live.
- Confidence below `CONFIDENCE_THRESHOLD` → case status `review_required`,
  every output carries the disclaimer *"AI-assisted draft — officer review required."*
- Validation fails **closed**: a section the validation agent does not explicitly
  confirm is dropped, never asserted to the officer.
- Role-based access (IO / SHO / Legal Advisor) via `X-Actor-Role` / `X-Actor-Name`
  headers — no login server, but every mutation is gated + attributed in the audit
  log. Mock-only government integrations (by design).
- Multilingual I/O via `POST /translate` (EN/HI/GU). OCR ingestion of scanned FIR images via
  `POST /ocr` (Tesseract — requires the host binary: `sudo apt-get install -y tesseract-ocr`).

## Data handling (state this in the pitch)

- The demo sends case text (incl. names/narrative) to **Groq's hosted LLM API**
  for the extraction/classification/validation agents. For real deployment this
  must run an **on-prem / air-gapped model** inside the police network; statute
  embeddings are pre-computed offline. Disclose this honestly — the offline-mode
  path is an explicit innovation scoring item.
- Untrusted FIR narrative is fenced as data in LLM prompts (prompt-injection guard).
  Charging sections are constrained to retrieved BNS/BNSS/BSA chunks; the repealed
  IPC/CrPC/IEA equivalent is shown as a verified, data-driven `old_code_ref`
  cross-reference (PS requirement), never an LLM-guessed charge.
- `audit_log` is append-only (UPDATE/DELETE/TRUNCATE blocked by DB triggers). For
  a true tamper-evident guarantee, run the app under a restricted DB role — see
  the note at the bottom of `db/schema.sql`.
