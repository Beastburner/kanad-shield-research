# CrimeGPT — Abstract

**Kanad S.H.I.E.L.D. 2026 · PS-69EEFDFB90B99 — AI-Powered Automation for Crime
Documentation and Legal Intelligence**
*Organizer: Cyber Crime Branch, Ahmedabad City Police · Venue: i-Hub Gujarat*

---

## Problem

Investigating Officers re-enter the same case data — names, addresses, items,
statements — across many legal documents (charge sheets, remand requests, seizure
receipts, medical and custody letters) and must manually identify the correct legal
provisions. This is slow, error-prone, and now harder still: the IPC, CrPC and
Indian Evidence Act have been replaced by the **BNS, BNSS and BSA (2023, in force
since 1 July 2024)**, so officers must charge under the new codes while still
recognising the old equivalents for case-law lookup.

## Proposed Solution

CrimeGPT is an officer-facing assistant that turns a single FIR narrative into a
complete, evidence-grade case file. From one **unified case-data pool** it (1) maps
the incident to the correct **BNS/BNSS/BSA** sections — each shown with its repealed
**IPC/CrPC/IEA cross-reference** and relevant **Indian Kanoon** judgments — (2)
auto-generates the required police documents, (3) stamps every document with a
**SHA-256 hash, timestamp and an auto-drafted BSA Section 63 (Part A) certificate**
for digital-evidence admissibility, and (4) maintains a chronological **case diary**
and an append-only audit log. Every AI output is labelled **"AI-assisted draft —
officer review required."** — the system *suggests*, the officer *decides*.

## Methodology — a 4-stage anti-hallucination pipeline

No single LLM output reaches the officer unchecked:

1. **Extraction** — structures facts from the narrative (grounded in input).
2. **Classification (RAG-constrained)** — suggests sections **only** from BNS
   bare-act text actually retrieved from the corpus, never from model memory.
3. **Validation** — an independent agent checks each section against the statute
   text and emits a confidence score; sections that fail are dropped (fail-closed).
4. **Generation** — fills statutory document templates with validated facts.

A **curated, source-verified BNS fallback mapping** acts as a live safety-net: if
the pipeline yields no validated section, CrimeGPT falls back to the vetted
crime→section table so a demo never dead-ends. Prompt-injection fencing protects the
untrusted narrative. Ground truth is **retrieved statute + real judgments**, not LLM
recall — so the system reasons over the law rather than claiming to "know" it.

## Key Features

- **8 document types** generated from shared data (exceeds the ≥4 requirement),
  each with SHA-256 + s.63 certificate and full version history.
- **Legal section intelligence**: BNS/BNSS/BSA mapping + IPC cross-reference +
  Indian Kanoon case-law, with per-section confidence and rationale.
- **Multilingual I/O** (English / Hindi / Gujarati) for UI and document output.
- **Case diary** (auto + manual entries) from FIR to arrest; keyword/case-number
  search across old cases.
- **Role-based access** (IO / SHO / Legal Advisor) with an attributable audit log.
- **Innovation**: evidence upload with hashing + tagging, demonstrative face
  matching, OCR ingestion of scanned FIRs, and documented **mock CCTNS / BharatPol**
  integration contracts (production plugs into ICJS endpoints).

## Tools & Stack

FastAPI (Python) · Groq + LLaMA-3.3-70B (4-agent orchestration) · PostgreSQL
(full-text retrieval over the bare-act corpus; pgvector-ready) · python-docx for
templated documents · hashlib (SHA-256) for evidence integrity · Tesseract OCR ·
OpenCV (face matching) · React 18 + Vite + Material UI + react-i18next (frontend).
Legal corpus from indiacode.nic.in (BNS/BNSS/BSA bare acts) and the Indian Kanoon
API for judgments — all from legitimate public/licensed sources, credited.

## Why It Wins

CrimeGPT is built for the people judging it: real officers. It is **lawful**
(new codes, never the repealed ones), **grounded** (no hallucinated law or
fabricated judgments), **evidence-grade** (hash + s.63 certificate on every
document), and **usable by a non-technical IO** — a practical, deployable system,
not a tech demo.
