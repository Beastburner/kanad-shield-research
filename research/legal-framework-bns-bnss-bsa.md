# Research — India's New Criminal Law Framework (BNS / BNSS / BSA)

> CRITICAL: India replaced its entire criminal law in July 2024. The **charging** sections in
> our demo must be BNS/BNSS/BSA — never an IPC/CrPC section as the charge.
> CORRECTION (per the official PS): the PS explicitly asks for "Cross-referenced IPC/CrPC/
> Evidence Act provisions where needed." So we DO show the old-code equivalent alongside each
> new-code section (e.g. BNS 303 · cf. IPC 379), clearly labelled as the repealed equivalent —
> useful for officers trained on IPC and for old case-law lookup. Primary = new codes;
> IPC/CrPC = labelled cross-reference only.

---

## The Three New Codes

| New Law | Full Name | Replaces |
|---------|-----------|----------|
| **BNS** | Bharatiya Nyaya Sanhita, 2023 | Indian Penal Code (IPC), 1860 |
| **BNSS** | Bharatiya Nagarik Suraksha Sanhita, 2023 | Code of Criminal Procedure (CrPC), 1973 |
| **BSA** | Bharatiya Sakshya Adhiniyam, 2023 | Indian Evidence Act, 1872 |

- Notified in the Gazette of India on **25 December 2023**.
- Came into force **1 July 2024** (except BNS s.106(2) and its BNSS first-schedule entry).

## Key BNS Facts Worth Citing

- BNS is the **substantive** criminal law (defines offences + punishments).
- **Section 4** introduces **Community Service** as a new form of punishment (six punishment
  types: death, life imprisonment, rigorous/simple imprisonment, forfeiture of property, fine,
  community service).
- Offences against **women and children**, murder, and offences against the State given precedence.
- Many offences made **gender-neutral**.
- New offence categories not in the old IPC:
  - **Section 111** — Organised crime
  - **Section 112** — Petty organised crime
  - **Section 113** — Terrorist act
  - **Section 103(2)** — Murder by a group of 5+ on grounds of race/caste/sex/etc.
  - **Section 95** — Hiring/employing/engaging a child to commit an offence
- Sexual offences cluster: **Sections 63–73** (rape, punishments, gang rape, repeat offenders,
  disclosure of victim identity, etc.).

## Key BNSS Facts Worth Citing

- **Sections 478–496** — provisions on bail and bond (relevant to remand/custody documents).
- **Section 290** — plea bargaining made time-bound (application within 30 days of charge framing).
- **Section 479** — maximum detention period for undertrial prisoners; first-time offender
  release on bond after 1/3 of max sentence served.
- **Section 360** — victim must be heard before withdrawal from prosecution.

## Why This Matters For CrimeGPT

- The legal-section classifier must output **BNS/BNSS/BSA** sections.
- Document templates (charge sheet, remand request, custody letter) must follow **BNSS** procedure.
- Showing new-code-only sections (111/112/113) in the demo proves we understand the 2024 overhaul.

## Official Sources For Statute Text

- **indiacode.nic.in** — official Government of India portal for legal codes & legislation
  (bare acts of BNS/BNSS/BSA). Use as ground-truth corpus.
- **Ministry of Home Affairs** — mha.gov.in/en/commoncontent/new-criminal-laws.
- **PIB** highlights of new criminal laws (press releases).

---

## Data Pipeline Notes (for the RAG build)

### (a) Getting machine-parseable bare-act text from India Code
- **Official portal:** indiacode.nic.in. Each act has a stable "handle" landing page that lists
  sections (hyperlinked, section-wise) plus a downloadable **PDF** of the full act.
  - BNS 2023: https://www.indiacode.nic.in/handle/123456789/20062
    (full-act PDF: https://www.indiacode.nic.in/bitstream/123456789/20062/1/a202345.pdf)
  - BNSS 2023: https://www.indiacode.nic.in/handle/123456789/20340
  - BSA 2023: browse from indiacode.nic.in (search "Bharatiya Sakshya Adhiniyam, 2023").
- **Format reality:** India Code serves **PDF (authoritative)** + an HTML section-browse view.
  There is **no clean public JSON/REST API** for the bare-act text. So the ingestion pipeline is:
  download the official PDF → extract text (pdfplumber / PyMuPDF; the BNS/BNSS/BSA PDFs are
  text-based, not scanned, so OCR is usually NOT needed) → **regex-split on the section-number
  pattern** (e.g. `^\d+\.` / "Section NNN") → store one chunk per section with metadata
  `{act, section_no, heading, text}` → embed into pgvector.
- ⚠️ Cite the **official India Code PDF** as ground truth; avoid "shadow PDFs" (unofficial
  copies with typos / bill-stage text). Source on shadow-PDF risk:
  https://jurigram.com/advocates/resources/new-laws/bare-act-bns-bnss-bsa-free-download

### (b) Indian Kanoon API (for judgments)
- **Docs:** https://api.indiankanoon.org/documentation/ · **Pricing:** https://api.indiankanoon.org/pricing/
- **Signup credit:** **₹500** free on signup to develop/test. Non-commercial use cases can get
  **₹10,000/month free** but require **use-case verification by the admin — apply now** (lead
  time). (Confirms README figures.)
- **Endpoints (4):** `/search/` (query → result list), `/doc/` (full document by doc-id),
  `/docfragment/` (matching text fragments for a query within a doc), `/docmeta/` (metadata).
  Results in **JSON or XML** (set via HTTP `Accept` header). Auth uses a public/private-key
  signed-request scheme (you sign requests server-side and POST to api.indiankanoon.org).
- **What it returns / reuse:** structured judgment data including paragraph classification,
  citation classification, and AI tags — reuse these for the "suggested judgments" feature
  rather than building our own classifier.

### (c) Recommended embedding model for Indian legal EN/HI text (RAG)
- **Primary: `BAAI/bge-m3`** — multilingual (handles Hindi + English + code-mixed), strong
  retrieval, supports long chunks (good for full section text). Justification: BNS/BNSS/BSA
  corpus is English bare-act text but officer narratives will be Hindi/Gujarati-influenced
  English; bge-m3's multilingual retrieval avoids the English-only ceiling.
- **Domain fallback / re-rank: `law-ai/InLegalBERT`** — pretrained on ~5.4M Indian legal docs,
  best for Indian-statute semantics, **but English-only** (weak on Hindi). Use as an
  English-only embedder or a domain re-ranker layered on bge-m3 retrieval.
  - Source: https://huggingface.co/law-ai/InLegalBERT
- Research note: in legal RAG the **embedding model choice dominates** end-to-end quality
  (more than the LLM), so this is worth getting right.
  - Source: https://milvus.io/ai-quick-reference/what-types-of-embedding-models-are-best-for-legal-documents
- ⚠️ Both are open-weight (self-host, no per-call cost) — good for offline/police-network demo.
  If GPU is unavailable at the venue, fall back to a hosted embedding API but pre-compute the
  statute embeddings offline so the live demo doesn't depend on connectivity.

### Sources (data pipeline)
- India Code BNS handle: https://www.indiacode.nic.in/handle/123456789/20062
- India Code BNSS handle: https://www.indiacode.nic.in/handle/123456789/20340
- Indian Kanoon API docs: https://api.indiankanoon.org/documentation/
- Indian Kanoon API pricing: https://api.indiankanoon.org/pricing/
- InLegalBERT: https://huggingface.co/law-ai/InLegalBERT
- Legal-embedding guidance: https://milvus.io/ai-quick-reference/what-types-of-embedding-models-are-best-for-legal-documents
