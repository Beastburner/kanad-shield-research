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

# 5. Run the API
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
│   ├── documents.py       stage-4 .docx generation (3 doc types)
│   ├── mocks.py           mock CCTNS / BharatPol
│   └── pipeline/
│       ├── llm.py         Groq client, JSON-schema-constrained output
│       ├── retrieval.py   RAG interface (vector or keyword fallback)
│       └── agents.py      4-stage pipeline + orchestrator
├── db/
│   ├── schema.sql         9 tables + append-only trigger + pgvector
│   └── seed.sql           demo BNS/BNSS/BSA corpus + judgment cache
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── API_CONTRACT.md        ← frontend handoff document
```

## Notes / scope

- **Retrieval = keyword (OR full-text) over heading + statute text + a per-section
  `keywords` column** of plain-language trigger terms (e.g. `upi otp phishing` →
  BNS 318; `entrusted diverted clerk` → BNS 316). This is deterministic and
  demo-safe, and pre-tests 10/10 on the scenarios in `../test-scenarios.md`.
  - **Upgrade path to semantic search (production):** implement
    `retrieval.embed()` with a 384-dim model (e.g. `bge-m3` / a
    sentence-transformers model — see `../../research/legal-framework-bns-bnss-bsa.md`),
    backfill `statute_chunks.embedding`, and `retrieve_statutes()` auto-switches
    to the pgvector query in `_vector_search`. **The agent code does not change.**
    Embeddings handle vocabulary mismatch the keyword layer can't; keep keywords
    as a hybrid fallback.
- Confidence below `CONFIDENCE_THRESHOLD` → case status `review_required`,
  every output carries the disclaimer *"AI-assisted draft — officer review required."*
- Validation fails **closed**: a section the validation agent does not explicitly
  confirm is dropped, never asserted to the officer.
- No auth, mock-only government integrations (by design).
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
