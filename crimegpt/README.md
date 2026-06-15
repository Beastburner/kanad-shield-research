# CrimeGPT — Build Guide

**PS-69EEFDFB90B99** · AI-Powered Automation for Crime Documentation and Legal Intelligence

The problem: officers re-enter the same data across many legal documents (charge sheets,
remand requests, seizure receipts, medical letters, etc.) and struggle to identify applicable
legal provisions. CrimeGPT = unified case data pool → auto-generate documents + AI legal
section/case-law mapping → digital case diary.

---

## ✅ BUILD (in priority order)

1. **Unified case data pool** — single entry of names/addresses/sections/items/statements,
   reused across all documents. Editable + traceable.
2. **Document generation engine** — ✅ **all 7 PS document types built**: Purvani Chargesheet,
   Remand Request, Seizure Receipt, Court Custody Letter, Accused Panchanama, Medical Treatment
   Letter, Accused Face Identification Form. Each carries SHA-256 + a BSA s.63 certificate.
   (Demo requires ≥2 live + ≥4 total — we exceed it.) Templates are structurally faithful;
   swap in real Gujarat proformas when available (isolated to one builder fn each).
3. **Legal section intelligence** — NLP maps incident narrative → **BNS/BNSS/BSA** sections
   + relevant Indian Kanoon judgments. This is the "intelligence" they score hardest.
4. **Anti-hallucination pipeline** (LazyCook 4-stage) — extraction → classification →
   validation → generation. RAG over real statute text. THE differentiator.
5. **Case diary automation** — timeline from FIR to arrest; logs investigative steps.
6. **Evidence integrity layer** — SHA-256 + timestamp on every doc; auto-draft **BSA s.63**
   certificate (Part A). Append-only audit log + version history.
7. **Search & audit** — retrieve old docs by keyword/case number.

## ⚠️ BUILD ONLY IF TIME (bonus / polish)

- Multilingual I/O (Gujarati/Hindi/English) — **keep as bonus**, demo core in English. Gujarati
  legal NLP is fragile; don't let it break live.
- Role-based access (IO / SHO / Legal Advisor).
- Mock CCTNS / BharatPol integration (documented contract).
- Evidence image upload + tagging.

## ❌ DON'T BUILD / DON'T CLAIM

- ❌ Documents that are half-working — quality over quantity (all 7 are built and tested).
- ❌ Autonomous "final" legal documents — always **"AI-assisted draft for officer review."**
- ❌ IPC/CrPC as the **charging** section — charges must be **BNS/BNSS/BSA** (laws in force).
  ✅ BUT the PS *requires* showing the **IPC/CrPC/Evidence-Act cross-reference** alongside each
  new-code section ("cf. IPC 379"), for officer familiarity + old case-law lookup. Built via a
  verified `old_code_ref` mapping (data-driven, not LLM-guessed).
- ❌ Real CCTNS integration — mock it (PS allows "simulated if required").
- ❌ Claiming the AI "knows the law" — it **retrieves and reasons over** statute text.
- ❌ Fabricated landmark judgments — only cite real Indian Kanoon results.

---

## Tech Stack (compliance-first)

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | **FastAPI (Python)** | Known from VERONICA; async fits multi-agent pipeline |
| LLM orchestration | **Groq + LLaMA 3.3-70B** | Reuse PRISM setup; fast inference for 4-stage pipeline |
| Legal corpus | **indiacode.nic.in** (bare acts) + **Indian Kanoon API** (judgments) | Ground truth for RAG |
| Vector DB | **pgvector on PostgreSQL** | Semantic retrieval; closes a target skill gap |
| Doc generation | **docxtpl / python-docx** | Templated legal documents |
| Evidence integrity | **hashlib (SHA-256)** + timestamps | BSA s.63 readiness |
| Audit trail | Append-only Postgres table | PS demands version history + audit |
| Frontend | **React.js** | Officer-friendly UI |
| OCR (if scanned input) | **Tesseract** | For scanned FIR ingestion |

## Indian Kanoon API — Access Notes

- Free **₹500** dev/test credit on signup.
- **₹10,000/month free** for non-commercial use (requires use-case verification — APPLY NOW).
- Returns structured judgment data: 8-category paragraph classification, citation
  classification, AI tags — reuse these for judgment suggestions instead of building our own.

## Demo Path (the one that must work flawlessly)

`Enter FIR narrative → extraction agent structures facts → classification agent suggests
BNS sections (with retrieved statute text shown) → validation agent confirms fit + confidence
→ generate charge sheet + remand request as .docx with SHA-256 hash + draft s.63 certificate
→ case diary logs the entry.`

3-minute, end-to-end, no dead ends.
