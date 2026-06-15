# CrimeGPT — Architecture

## Anti-Hallucination Pipeline (LazyCook-derived, 4 stages)

```
FIR narrative (text input)
        │
        ▼
┌─────────────────────────┐
│ 1. EXTRACTION AGENT     │  Pulls structured facts (names, dates, items, sequence)
│   LLaMA 3.3-70B (Groq)  │  Output: structured JSON. Low hallucination (grounded in input).
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐     ┌──────────────────────────────┐
│ 2. CLASSIFICATION AGENT │◄────│ RAG: BNS/BNSS/BSA bare-act    │
│   Constrained to        │     │ text (indiacode.nic.in)       │
│   retrieved statute set │     │ + Indian Kanoon judgments     │
│                         │     │ stored in pgvector            │
│  Suggests sections      │     └──────────────────────────────┘
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. VALIDATION AGENT     │  "Do these sections fit these facts?" vs actual section text.
│   Independent check     │  Outputs confidence + concerns. Low confidence → loop back to (2).
└───────────┬─────────────┘
            ▼ (only on pass)
┌─────────────────────────┐
│ 4. GENERATION AGENT     │  Fills document templates with validated facts + sections.
│   docxtpl / python-docx │  Mostly templating → minimal hallucination.
└───────────┬─────────────┘
            ▼
   Generated .docx
        │
        ▼
┌─────────────────────────┐
│ EVIDENCE INTEGRITY      │  SHA-256 hash + timestamp + draft BSA s.63 certificate (Part A)
│ + APPEND-ONLY AUDIT LOG │  Version history for every edit
└─────────────────────────┘
```

## Data Model (core tables)

- `cases` — case_id, status, created_at, fir_narrative
- `case_facts` — structured extracted entities (editable, traceable)
- `suggested_sections` — case_id, code (BNS/BNSS/BSA), section_no, confidence, statute_text_ref
- `suggested_judgments` — case_id, indiankanoon_doc_id, relevance, tags
- `documents` — doc_id, case_id, type, file_path, sha256, generated_at, s63_cert_path
- `case_diary` — case_id, timestamp, event_type, description
- `audit_log` — append-only; doc_id, action, actor, before/after, timestamp

## Mock Integrations (documented contracts)

- `POST /mock/cctns/fir` → returns simulated FIR record.
- `GET /mock/bharatpol/lookup` → simulated international lookup.
- All mocks documented via OpenAPI/Swagger as "integration-ready."

## Component Reuse From Our Prior Work

- **PRISM** → multi-agent orchestration + Groq/LLaMA wiring.
- **LazyCook** → the 4-stage refinement pattern.
- **VERONICA** → RAG retrieval pattern (inject only top-k relevant statute chunks).
