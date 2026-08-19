# CrimeGPT — System Documentation

**Kanad S.H.I.E.L.D. 2026 · PS-69EEFDFB90B99 · Cyber Crime Branch, Ahmedabad City Police**

This is the complete technical reference: what every folder does, how each
subsystem works, and the exact path an FIR takes from narrative to court-ready
case file. Written for pitch preparation and technical Q&A — every claim in it
is traceable to a file and, where stated, to a test.

---

## 1. What CrimeGPT is, in one paragraph

An Investigating Officer enters an FIR narrative **once**. CrimeGPT extracts the
facts into a unified case-data pool, maps the incident to the correct sections of
the laws **in force** (BNS/BNSS/BSA plus the special acts — PC Act, IT Act, NDPS,
Arms Act, POCSO), each shown with its repealed IPC/CrPC cross-reference and real
Indian Kanoon case law, then generates **nine** police documents from that single
pool — each stamped with a SHA-256 hash, a timestamp, and an auto-drafted BSA
s.63 certificate — while a case diary and a tamper-proof audit log record every
action. Every AI output is labelled **"AI-assisted draft — officer review
required."** The system suggests; the officer decides.

**The demo path:** New Case → paste FIR → Analyze → review facts (editable) →
review sections (confidence + cross-ref + rationale) → review judgments →
generate chargesheet + remand request → open the .docx → download the s.63
certificate → Case Diary → Audit Trail.

---

## 2. Repository map

```
crimegpt/
├── README.md                     build guide: priorities, stack, demo path
├── ABSTRACT.md                   the submitted abstract
├── PRESENTATION.md               slide-by-slide outline + speaker notes
├── architecture.md               pipeline diagram + data model
├── compliance-checklist.md       every scoring criterion, ticked with evidence
├── test-scenarios.md             the 10-scenario classifier pre-test (human-readable)
├── fallback-section-mapping.md   the curated crime→section table, sourced
├── document-format-research.md   real proforma research (C.P.C. 20, NCRB IIF, BNSS Schedule)
├── DOCUMENTATION.md              ← this file
├── backend/                      FastAPI + PostgreSQL
└── frontend/                     React 18 + Vite + Material UI
```

```
backend/
├── app/
│   ├── main.py            every API endpoint (the only file that touches HTTP)
│   ├── config.py          settings, loaded from .env
│   ├── db.py              asyncpg connection pool (no ORM)
│   ├── models.py          Pydantic request/response contracts
│   ├── rbac.py            role-based access (IO / SHO / LEGAL_ADVISOR)
│   ├── audit.py           the single write-path into the append-only audit log
│   ├── documents.py       9 document builders → .docx
│   ├── integrity.py       SHA-256 + BSA s.63 certificate drafting
│   ├── evidence.py        evidence file storage with content hashing
│   ├── face.py            face detection + demonstrative matching (OpenCV)
│   ├── ocr.py             scanned-FIR ingestion (Tesseract + PyMuPDF)
│   ├── translate.py       Hindi/Gujarati translation, incl. whole .docx files
│   ├── forensics.py       document tamper screening (triage, not verdicts)
│   ├── mocks.py           mock CCTNS / BharatPol (honestly labelled)
│   └── pipeline/
│       ├── agents.py      the 4-stage pipeline orchestrator
│       ├── llm.py         Groq client + NVIDIA failover, JSON-mode enforcement
│       ├── retrieval.py   RAG layer: statutes (pgvector/keyword) + judgments (Indian Kanoon)
│       └── fallback.py    curated crime→section safety-net (29 categories)
├── db/
│   ├── schema.sql         tables, triggers, indexes (applied on first DB boot)
│   ├── seed.sql           63 statute chunks + judgment cache + cross-references
│   ├── special_acts.sql   +19 special-act sections (PC Act, IT Act, NDPS, Arms, POCSO)
│   └── reset_cases.sql    wipes case data, keeps the legal corpus
├── scripts/
│   ├── run_scenarios.py   13-scenario classifier gate (run before every demo)
│   ├── check_providers.py verifies both LLM providers return parseable JSON
│   └── embed_statutes.py  backfills pgvector embeddings (semantic retrieval)
├── tests/                 47 tests: documents, integrity, RBAC, audit, forensics
├── docker-compose.yml     Postgres 16 + pgvector, auto-applies schema+seed
└── render.yaml            deployment config (Render blueprint)
```

---

## 3. The life of a case (end-to-end walkthrough)

This is the spine of the pitch. Every step names the code that does it.

### Step 1 — Case creation
`POST /cases` (main.py) inserts into `cases` with status `new`, writes a
`fir_filed` diary entry and a `case.create` audit row attributed to the signed-in
officer. The narrative can be typed, imported from the mock CCTNS endpoint, or
produced by OCR from a scanned FIR (`POST /ocr` → ocr.py: images go through
Tesseract; PDFs use the embedded text layer if digital, rasterise-and-OCR if
scanned).

### Step 2 — Analysis (`POST /cases/{id}/analyze`)
`run_pipeline()` in `pipeline/agents.py` executes the four stages (§5). The
result — facts, sections, judgments, confidence, concerns — is persisted:
facts upsert into `case_facts`, sections and judgments replace previous rows in
`suggested_sections` / `suggested_judgments`, the case status becomes
`analyzed` or `review_required`, and diary + audit entries are written.

### Step 3 — Officer review
`PATCH /cases/{id}/facts` lets the officer correct any extracted fact. The edit
is stored with `source = 'officer_edit'`, logged to the diary, and written to the
audit log with before/after values — the correction is attributable and
traceable.

### Step 4 — Document generation (§6 in detail)
`POST /cases/{id}/documents` builds any of the 9 types from the same case-data
pool. Regenerating a type produces version 2, 3… — earlier versions are marked
`superseded`, never deleted.

### Step 5 — Evidence
`POST /cases/{id}/evidence` stores an uploaded file under
`artifacts/evidence/`, SHA-256-hashed at receipt (evidence.py), with officer
tags; OpenCV counts faces in images. `POST /cases/{id}/face/match` compares a
probe photo against enrolled evidence — a demonstrative matcher, explicitly
labelled not-forensic in its API response.

### Step 6 — The record
`GET /cases/{id}/diary` is the chronological case diary (system events + manual
officer entries). `GET /cases/{id}/audit` is the append-only audit trail — every
mutation, every actor, before/after state. `GET /cases?q=` searches old cases by
keyword or case number.

---

## 4. Backend reference, file by file

### main.py — the API surface
Every endpoint lives here; there are no hidden routers. Highlights:

| Endpoint | What it does |
|---|---|
| `POST /cases`, `GET /cases?q=`, `GET/PATCH /cases/{id}` | case CRUD + keyword search |
| `GET/PATCH /cases/{id}/facts` | read / correct the extracted facts |
| `POST /cases/{id}/analyze` | run the 4-stage pipeline |
| `GET /cases/{id}/analysis` | read the stored result without re-running the LLM |
| `POST /cases/{id}/documents` | generate one of the 9 document types |
| `GET /documents/{id}/file`, `/certificate` | download the .docx / the s.63 certificate |
| `GET/POST /cases/{id}/diary` | case diary (auto + manual entries) |
| `GET /cases/{id}/audit` | read-only view of the append-only audit log |
| `POST /cases/{id}/evidence`, `GET …/evidence`, `GET /evidence/{id}/file` | evidence upload/list/download |
| `POST /cases/{id}/face/match` | demonstrative face matching |
| `POST /mock/cctns/fir`, `GET /mock/bharatpol/lookup` | labelled mocks (see mocks.py) |
| `POST /ocr` | scanned FIR → text |
| `POST /forensics/screen` | tamper-screen an uploaded PDF/image (triage flags) |
| `POST /translate` | free-text translation (en/hi/gu) |
| `GET /health` | liveness |

The full request/response contract is in `backend/API_CONTRACT.md`.

### config.py — settings
Loaded from `.env` via pydantic-settings. The ones that matter:

| Variable | Meaning | Default |
|---|---|---|
| `GROQ_API_KEY` | primary inference | required |
| `GROQ_MODEL` | primary model | `openai/gpt-oss-120b` (open-weight) |
| `NVIDIA_API_KEY` | failover provider (build.nvidia.com) | empty = no failover |
| `NVIDIA_MODEL` | failover model | `meta/llama-3.3-70b-instruct` |
| `CONFIDENCE_THRESHOLD` | below this ⇒ review_required | `0.6` |
| `INDIANKANOON_API_TOKEN` | live case-law search | empty = seeded cache only |
| `DATABASE_URL` | Postgres DSN | local docker instance |
| `ARTIFACT_DIR` | where .docx files are written | `./artifacts` |

Why gpt-oss-120b: Groq **retired** llama-3.3-70b-versatile and
llama-3.1-8b-instant (404) and decommissioned gemma2-9b-it (400). gpt-oss-120b is
the working model — and it is **open-weight**, so the identical pipeline can move
to self-hosted government infrastructure without a rewrite.

### db.py — the data layer
A 5-connection asyncpg pool, no ORM (deliberate — the schema is small, queries
are direct SQL). One codec registration makes JSONB transparently a Python dict.

### models.py — the contracts
Pydantic v2 models mirroring the schema. Notable details:
- `LegalCode` is a closed literal of the 8 permitted codes — a section under any
  other code is rejected at the model layer before it can reach the officer.
- `ExtractedFacts` coerces LLM oddities (`null` for a list, numbers inside one)
  into clean `list[str]` so a slightly-malformed extraction never crashes the
  pipeline mid-demo.
- `DISCLAIMER` — "AI-assisted draft — officer review required." — is attached to
  every analysis result and every document response.

### rbac.py — who may do what
Header-driven (no auth server in this build): the frontend sends `X-Actor-Role`
and `X-Actor-Name` on every request; the actor string flows into the diary and
audit log, so every mutation is attributable.

- **IO** (Investigating Officer): full workflow.
- **SHO** (Station House Officer): everything, supervisory.
- **LEGAL_ADVISOR**: read + analysis only — cannot create cases, file documents,
  add diary entries, or upload evidence. Enforced at the API with 403, not hidden
  in the UI.
- **Unknown role values fail closed** (403). A missing header defaults to IO
  (documented no-auth-server behaviour); a *present but wrong* header is
  rejected — a typo can never escalate privilege. Regression-tested.

### audit.py — the single write path
Every mutating endpoint calls `audit.record(action, case_id, doc_id, actor,
before, after)`. That is the **only** insert path in the codebase, and the table
itself is guarded by database triggers (schema.sql) that raise on any UPDATE or
DELETE — append-only is a property of the database, not a convention of the
code. The test suite attacks it over a raw connection that bypasses the API and
asserts both operations are refused.

### documents.py / integrity.py — see §6.

### evidence.py
Saves uploaded bytes under `artifacts/evidence/` with a randomised name
(collision-proof, original extension kept for previews) and returns the path plus
its SHA-256 — hashing at the moment of receipt, so chain of custody starts
immediately.

### face.py
Detection is real (OpenCV Haar cascade). Matching is a transparent heuristic —
normalised grayscale crops compared by cosine correlation — deliberately **not**
a forensic identifier, and the API response says so. The design isolates
`_signatures()` / `_similarity()` so a real embedding model (ArcFace/FaceNet)
can be swapped in without changing any caller.

### ocr.py
Images → Tesseract. PDFs → PyMuPDF: if the embedded text layer has ≥30
characters, use it directly (digital PDF, exact); otherwise rasterise each page
at 200 DPI and OCR (scanned PDF). Language packs: `eng`, `hin`, `guj` are
supported via the `lang` parameter.

### translate.py
Uses the same LLM (no extra dependency). Two paths:
1. Free-text translation (`/translate`) for UI use.
2. **Whole-document translation** — a generated .docx is walked paragraph by
   paragraph (tables included), translated in one batch call keyed by index
   (a dropped item falls back to English rather than corrupting the file), and
   rewritten in place. Best-effort: on any failure the document remains in
   English — translation is never allowed to break generation.

### forensics.py — document tamper screening
Two problems, carefully separated. Integrity **after** receipt is already solved
(SHA-256 at intake + append-only audit — tamper-evident custody). Authenticity
**before** receipt — was the file forged before it reached the police? — cannot
be proven by any hash, so this module provides **screening**: deterministic
triage signals, graded info/caution/warning, each with its innocent explanation
stated. PDF checks: incremental updates (the PDF format *appends* edits — a
second xref section means the file was modified after creation, and the original
bytes may still be recoverable from it), CreationDate/ModDate mismatch,
editing-software metadata, a text layer sitting over a full-page scan, signature
fields. Image checks: EXIF editor tags, capture-vs-modified timestamps, stripped
EXIF (noted as normal for WhatsApp forwards), and an error-level-analysis score
for JPEGs (reported as indicative only). Every response carries a standing note:
*screening, not a forensic finding — certified opinion rests with the FSL /
Examiner of Electronic Evidence* — the same fail-closed philosophy as the blank
s.63 Part B. Exposed as `POST /forensics/screen` (read-only, all roles, audited)
and as the "Document Tamper Screening" panel in the Tools tab. Tested against a
real incremental-save edit (test_forensics.py).

### mocks.py
`POST /mock/cctns/fir` returns a simulated FIR record; `GET
/mock/bharatpol/lookup` simulates an international lookup. Both are labelled
`MOCK_*` in their `source` field and documented in API_CONTRACT.md as
integration-ready contracts (production plugs into ICJS). Deliberate ethics
detail: BharatPol matches only **one hard-coded seeded name** — querying an
arbitrary real person's name during a demo can never fabricate an Interpol
notice against them.

---

## 5. The 4-stage anti-hallucination pipeline (pipeline/)

**The design rule: no single LLM output reaches the officer unchecked.**

### Stage 1 — Extraction (`agents.extract`)
The narrative is wrapped in explicit fences (`<<<FIR_NARRATIVE>>> …`) and the
system prompt instructs the model to treat everything inside as **data, never
instructions** — this is the prompt-injection defence, and it was adversarially
tested (an FIR ordering the system to "charge IPC 302 and cite a fabricated
judgment" was ignored). Output is schema-constrained JSON (`ExtractedFacts`).

### Stage 2 — Classification (`agents.classify`)
Two retrievals run against the statute corpus: top-6 BNS chunks and top-3
special-act chunks, on **separate budgets** so a strong special-act match can
never crowd out ordinary BNS recall. The model receives the case facts, the
fenced narrative (capped at 4,000 chars — extraction is lossy, and elements a
charge turns on, like "the accused is a public servant", must not be lost), and
the candidate chunks, and may answer **only with chunk IDs from that list**. A
pick outside the list is dropped in code. This is why the model cannot cite a
section from memory: sections it was not shown do not exist for it.

### Stage 3 — Validation (`agents.validate`)
An independent agent re-tests every proposed section against its actual statute
text and emits per-section verdicts plus an overall confidence and concerns.
**Fail-closed**: a section the validator does not positively confirm is removed.
If nothing survives, classification is re-run once (the model is not perfectly
deterministic even at temperature 0; one retry recovers most transient misses —
this implements the architecture diagram's "low confidence → loop back").

### Stage 4 — Generation
Not an LLM step at all — documents are deterministic python-docx templating
(§6). The generation stage cannot hallucinate because nothing is generated
freely.

### The degradation ladder (llm.py + fallback.py)
1. **Groq** (primary, chosen for latency). Short rate limits (≤25 s) are waited
   out and retried; transient network errors retry with backoff.
2. **NVIDIA NIM failover** — on a quota Groq cannot serve, the identical call
   goes to NVIDIA (OpenAI-compatible). If a provider rejects JSON-mode
   (`response_format`), the client drops the parameter and relies on the JSON
   Schema that is injected into every system prompt anyway, stripping markdown
   fences from the reply.
3. **Curated fallback** (`fallback.py`) — if the LLM stages fail entirely, a
   29-category, source-verified crime→section table matches the **raw
   narrative** (not the extracted facts — the net must work precisely when
   extraction failed). Keywords are written the way real FIRs are written
   ("the motorcycle was gone", "the Tehsildar demanded ₹15,000"). Every entry
   resolves against the seeded statute rows, so even a fallback suggestion
   carries real bare-act text and a verified cross-reference. Verified: 13/13
   scenarios still produce correct sections with the LLM entirely offline.

**Honesty guarantee**: a degraded run *announces itself*. `llm_failed` forces
`review_required` regardless of the fallback's 0.70 confidence, the concern text
says exactly what happened, and the UI shows an amber banner — a run where the
AI never executed can never present as a clean success.

### Case law (retrieval.py)
With a token set, judgments come from the **live Indian Kanoon API**, filtered
to documents from courts and tribunals (an unfiltered search returns bare
legislation — caught in the adversarial audit and fixed), then cached into
`judgments_cache` so the next network failure degrades to *real cached
judgments*, never to nothing. There is **no generation step in the judgment
path** — nothing exists for the model to fabricate into.

### Statute retrieval (retrieval.py)
If pgvector embeddings are populated (`scripts/embed_statutes.py`, fastembed
ONNX, all-MiniLM-L6-v2, 384-dim), retrieval is semantic (cosine). Otherwise it
transparently falls back to PostgreSQL full-text keyword search over
heading+text+keywords. The agent code never changes — it only consumes chunks.

---

## 6. How a document is generated, exactly

`POST /cases/{id}/documents {type, lang}` — the full chain, in order:

1. **Guard**: facts must exist (409 "run /analyze before generating documents"
   otherwise). RBAC: IO or SHO only.
2. **Load the pool**: the extracted facts and every suggested section for the
   case are fetched from the DB — documents are built from the *reviewed* case
   data, not from a fresh LLM call.
3. **Build** (`documents.generate`): a python-docx `Document` gets the
   government title block (`_DOC_META` supplies each type's title and statutory
   citation), the shared case header, then the type's builder function fills
   the body — headings, bordered key-value tables, party/property/witness
   tables, sign-off blocks — and the disclaimer footer. Any field the case data
   cannot fill is left as a blank line for the officer, never invented.
4. **Translate before hashing** — if `lang` is `hi`/`gu`, the whole .docx is
   translated in place *first*, so **the hash matches the file the officer
   actually delivers**.
5. **Hash** (`integrity.sha256_file`): SHA-256 over the file bytes.
6. **Certificate** (`integrity.draft_s63_certificate`): a companion .docx —
   BSA s.63 **Part A** with case number, type, filename, hash, UTC timestamp,
   the four statutory conditions, and blanks for the certifying officer.
   **Part B is deliberately blank**: technical certification belongs to an
   Examiner of Electronic Evidence, and the system refuses to auto-assert
   expert findings. (Also translated if requested.)
7. **Version**: the next version number for this (case, type) is computed,
   prior versions are marked `superseded = true` (never deleted), and the row
   is inserted with path, hash, cert path, version, language.
8. **Record**: a `document_generated` diary entry and a `document.generate`
   audit row, attributed to the officer.

### The nine document types

| Type | Title | Cited authority |
|---|---|---|
| `chargesheet` | Final Report (Charge Sheet) | BNSS s.193 |
| `remand_request` | Application for Police Custody Remand | BNSS s.187 |
| `seizure_receipt` | Seizure Memo / Panchnama | BNSS ss.103, 105 & 106 |
| `court_custody_letter` | Letter for Judicial Custody | BNSS s.187(2) |
| `accused_panchanama` | Arrest Panchnama | BNSS s.105 |
| `medical_treatment_letter` | Requisition for Medical Examination | BNSS s.51 |
| `face_identification_form` | Accused Face Identification Form | investigation aid (see below) |
| `lers_request` | Data request to Meta/WhatsApp | BNSS s.94 r/w IT Act + platform LERS |
| `appearance_notice` | Notice for Appearance by the Police | **BNSS s.35(3) — Second Schedule Form No. 1** |

Two documents deserve a prepared answer:

- **`appearance_notice`** is the only police-issued investigative form
  prescribed anywhere in the BNSS Second Schedule (Form No. 1 of 58) — so its
  layout is **statutory, not our design**. This is the strongest format-fidelity
  claim in the system.
- **`face_identification_form`** prints its own legal status on the document:
  it is a descriptive-roll investigation aid, **not** a Test Identification
  Parade — a TIP requires a Magistrate, and an identification in police presence
  has no evidentiary value. Saying so on the form shows the distinction is
  understood, and prevents misuse.

On overall format fidelity, the honest position (and the prepared answer):
templates are structurally faithful, grounded in the bare acts, but not
proforma-identical — Gujarat's chargesheet proforma is a State-prescribed form
(Form C.P.C. 20, Gujarat Police Manual Vol. III r.231). `document-format-research.md`
maps the exact field-level gap for every document, and each builder is one
isolated function, so swapping in a prescribed layout is a template change, not
a redesign.

---

## 7. Database schema (db/schema.sql)

| Table | Purpose | Notable properties |
|---|---|---|
| `cases` | one row per case | status, narrative, analysis confidence + concerns |
| `case_facts` | the unified case-data pool | one JSONB blob per case; `source` records whether it came from the extraction agent or an officer edit |
| `suggested_sections` | the charge suggestions | code restricted by CHECK to the 8 permitted codes; carries confidence, rationale, `statute_chunk_id` (traceback to the exact retrieved text), `validated` flag |
| `suggested_judgments` | Indian Kanoon suggestions | doc id, title, relevance, tags |
| `documents` | every generated document | path, sha256, s63 cert path, `version`, `superseded`, `lang` |
| `case_diary` | chronological timeline | system + officer entries, attributed |
| `audit_log` | the chain of custody | **append-only by trigger** — UPDATE and DELETE raise; before/after JSONB per action |
| `statute_chunks` | the RAG corpus | 82 sections: BNS 43, BNSS 12, BSA 8, special acts 19; heading + full text + keywords + verified `old_code_ref` + `vector(384)` embedding column; UNIQUE (code, section_no) |
| `judgments_cache` | offline case-law | seeded set + every live result is upserted for offline reuse |
| `evidence` | uploaded files | path, sha256, tags, face count, uploader |

The corpus is seeded from `seed.sql` (BNS/BNSS/BSA, written from
indiacode.nic.in bare acts) + `special_acts.sql` (PC Act ss.7/7A/8/13, IT Act
ss.66/66C/66D/67/67B, NDPS ss.8/20/21/22, Arms Act ss.25/27, POCSO ss.4/6/8/12).
Every BNS `old_code_ref` was audited against the official BNS↔IPC concordance —
44/44 correct, including the deliberate non-equivalences ("New offence under
BNS" for snatching; "cf." for s.152 vs the repealed 124A).

---

## 8. Frontend (frontend/src/)

React 18 + Vite + TypeScript + Material UI + react-i18next. Three routes
(HashRouter): Dashboard (`/`), New Case (`/new`), Case Workspace (`/case/:id`).

### Cross-cutting
- **api.ts** — a single axios client. An interceptor attaches
  `X-Actor-Role`/`X-Actor-Name` from localStorage to every request (this is how
  RBAC and audit attribution work). A 120-second timeout distinguishes a slow
  analyze (legitimate: 3 LLM stages) from a dead backend.
- **useActor.ts** — reactive role hook; `canWrite` is false for LEGAL_ADVISOR,
  so write controls hide in the UI *and* the API would refuse them anyway.
- **i18n.ts** — 234 keys × 3 languages (en/hi/gu), 226 `t()` call sites. The
  chosen language persists in localStorage — and because document generation
  sends `i18n.language` as the output language, persistence means a reload can
  never silently switch an officer's documents back to English. Statutory
  abbreviations (BNS, BNSS, BSA, s.63, FIR, SHA-256…) stay in Latin script in
  all three languages, as officers read them.
- **Header.tsx** — officer name/role switcher and the language switcher.

### Dashboard
Case list with search (`?q=`), stat cards, status chips. A failed fetch shows an
error state with Retry — it can never masquerade as "no cases exist". A stale
search response can never overwrite a newer one (request-sequence guard).

### New Case
FIR entry with three intake routes: typed narrative, mock-CCTNS import, OCR
upload.

### Case Workspace — the 7 tabs
1. **Facts Extraction** — the unified pool, fully editable, "Save Fact
   Corrections" writes an attributed audit entry.
2. **Legal Classification** — section cards: code + number chip, heading,
   confidence bar, rationale (translatable in place), statute text, and the
   cross-reference chip — `cf. IPC 379` for BNS sections, `Special Act — in
   force` for unrepealed special acts. Judgments listed below.
3. **Legal Documents** — the 9 type cards; generate, preview in-browser
   (docx-preview), download file + certificate; version chips.
4. **Case Diary** — timeline with event-type icons; manual entries for IO/SHO.
5. **Evidence & Face Match** — upload with tags (hashed at receipt), face-match
   panel with its not-forensic caveat.
6. **Mock Integrations & Tools** — CCTNS FIR import, BharatPol lookup, quick
   translation tool.
7. **Audit Trail** — the append-only log rendered as a table (when / action /
   actor / change), labelled append-only.

### Honesty surfaces (worth pointing at in the demo)
- The header **AI Confidence Score** shows green only when the number is
  trustworthy: confidence > 0.7 **and** no forced review **and** no concerns.
  The degraded path reports exactly 0.70 — deliberately amber.
- Two banner states, not one: amber **Officer Review Required** when the
  pipeline cannot stand behind the result; a quieter blue **Validator notes**
  when the analysis passed but the validator recorded caveats (e.g. "extortion
  requires fear of injury; the narrative does not state a threat"). The system
  distinguishes "I can't stand behind this" from "here is a caveat".

---

## 9. Verification (scripts/ + tests/)

| Gate | What it proves | Cost |
|---|---|---|
| `python -m pytest` (47 tests, ~6 s) | all 9 document types produce valid OOXML with hash + certificate; the stored SHA-256 matches an **independent recomputation from the file bytes** and appears inside the certificate; version supersession; RBAC allow/deny incl. the fail-closed regression; audit log UPDATE/DELETE **refused at the database level** over a raw connection | zero LLM tokens |
| `python -m scripts.run_scenarios` (13 scenarios) | the classifier returns the expected primary sections; **hard-fails if any repealed IPC/CrPC/IEA section ever appears as a charge** | ~⅓ of a free-tier Groq day — run early, not repeatedly |
| `python -m scripts.check_providers` | both LLM providers reachable and returning parseable JSON | a few hundred tokens |

Beyond the gates, a 7-probe adversarial battery was run (prompt injection,
old-code bait, cheating-vs-breach-of-trust, murder-vs-culpable-homicide,
matrimonial cruelty, civil-dispute misuse, attempt-to-murder): six held; the
civil-dispute probe is the honest known limitation — the system suggests a
section but flags "not merely a civil dispute" for officer review rather than
refusing outright.

---

## 10. Claims → proof map (for Q&A)

| If they ask… | The answer is in… |
|---|---|
| "Can it hallucinate a law?" | §5 stage 2 — chunk-ID whitelist; picks outside the retrieved list are dropped in code |
| "Can an FIR manipulate it?" | §5 stage 1 fencing; adversarial probe A1 held |
| "Can it fabricate a judgment?" | §5 case law — no generation step exists in that path |
| "What if the AI is down?" | §5 degradation ladder; 13/13 offline; degraded runs force review |
| "Is the audit log really tamper-proof?" | §4 audit.py + §7 — DB trigger, attacked directly in tests |
| "Are the hashes real?" | §9 — recomputed independently from file bytes in tests |
| "IPC still valid here?" | never as a charge — only as cross-reference; hard-fail in run_scenarios |
| "Special acts?" | §7 corpus — PC Act, IT Act, NDPS, Arms Act, POCSO, retrieved on their own budget |
| "Real Gujarat formats?" | §6 honest position + document-format-research.md; Form No. 1 at 100% fidelity |
| "Which model? Vendor lock-in?" | §4 config — open-weight gpt-oss-120b; failover provider; on-prem path |
| "Who is accountable?" | §4 rbac + disclaimer on every output; officer edits are attributed |
| "Data privacy?" | data stays in your Postgres; only the narrative goes to the inference provider; open-weight model enables full on-prem |

## 11. Glossary

**BNS/BNSS/BSA** — Bharatiya Nyaya Sanhita (penal code), Bharatiya Nagarik
Suraksha Sanhita (procedure), Bharatiya Sakshya Adhiniyam (evidence) — replaced
the IPC, CrPC and Evidence Act on 1 July 2024. **s.63 certificate** — the BSA's
admissibility certificate for electronic records (successor to Evidence Act
s.65B). **FIR** — First Information Report. **CCTNS** — Crime and Criminal
Tracking Network & Systems (the national police records network; mocked here,
ICJS is the production integration point). **LERS** — Meta's Law Enforcement
Request System. **RAG** — retrieval-augmented generation: the model reasons over
retrieved statute text instead of recalling law from memory. **Fail-closed** —
when uncertain, exclude; never assert. **TIP** — Test Identification Parade,
valid only before a Magistrate.
