# CrimeGPT Backend

FastAPI backend for **CrimeGPT** (PS-69EEFDFB90B99, Kanad S.H.I.E.L.D. 2026).
Ingests an FIR narrative and runs a 4-agent anti-hallucination pipeline:

```
FIR narrative → extraction → classification (RAG over BNS/BNSS/BSA) →
validation (confidence) → document generation (.docx) → SHA-256 + BSA s.63
certificate + append-only audit log + case diary
```

All legal references are **BNS / BNSS / BSA only** (no IPC/CrPC).
The React frontend is built by a separate team — see **API_CONTRACT.md**.

## Tech

FastAPI (async) · PostgreSQL + pgvector · Groq + LLaMA-3.3-70B · docxtpl/python-docx · hashlib (SHA-256)

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

# 4. Python env + deps
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 5. (optional) enable semantic retrieval — backfill statute embeddings once.
#    Skip this and retrieval falls back to keyword search automatically.
python -m scripts.embed_statutes

# 6. Run the API
uvicorn app.main:app --reload --port 8000
```

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
