# CrimeGPT — Compliance Checklist

Tick these before the pitch. Each maps to an explicit scoring criterion.

Status verified 2026-08-18 by running the pipeline end-to-end (see
`backend/scripts/run_scenarios.py` — 13/13 PASS).

## Legal Accuracy
- [x] **Charging** sections are **BNS / BNSS / BSA** or a **special act in force**
      (PC Act, IT Act, NDPS, Arms Act, POCSO) — never an IPC/CrPC section as the
      charge. `run_scenarios.py` hard-fails if a repealed code appears as a charge.
- [x] Each section ALSO shows its repealed **IPC/CrPC/Evidence-Act cross-reference**
      ("cf. IPC 379"), clearly labelled as the old equivalent — **the PS explicitly requires
      this** ("Cross-referenced IPC/CrPC/Evidence Act provisions where needed").
      Special acts show "Special Act — in force" instead, since they were never repealed.
- [x] Legal suggestions retrieved from real statute text (indiacode.nic.in), not model recall.
      Classification can only pick from chunks actually retrieved from the corpus.
- [x] Case-law suggestions are real Indian Kanoon results (no fabricated judgments).
      Live API verified working; falls back to the seeded cache when the token is absent.
- [x] Pre-tested classifier on **10 real crime scenarios** before the event —
      automated as `python -m scripts.run_scenarios` (13 scenarios: the 10 from
      `test-scenarios.md` plus PC Act / NDPS / Arms Act special-act coverage).
- [x] Curated fallback mapping table for common crimes (theft, fraud, assault, cybercrime)
      — 29 crime categories in `backend/app/pipeline/fallback.py`, matched against the
      raw narrative so it still fires when the LLM stages misfire.

## Document Integrity (BSA s.63)
- [x] Every generated document carries a **SHA-256 hash**.
- [x] Every document carries a **timestamp**.
- [x] System auto-drafts a **Section 63 certificate (Part A)** for evidentiary docs.
- [x] **Append-only audit log** with version history on all edits — enforced by DB
      triggers that reject UPDATE/DELETE, readable at `GET /cases/{id}/audit` and
      shown in the workspace's **Audit Trail** tab.

## Document Format Fidelity
- [ ] Templates reverse-engineered from **real Gujarat police document formats** (RTI/public samples).
      ⚠️ **STILL OPEN** — builders in `backend/app/documents.py` are structurally faithful
      but generic. Needs actual sample proformas; isolated to one builder fn each.
- [ ] Output matches statutory field layout (not "close but wrong"). Blocked on the above.

## Framing & Ethics
- [x] All outputs labelled **"AI-assisted draft — officer review required."**
- [x] No claim of autonomous legal authority.
- [x] Originality: pipeline is our own (LazyCook/PRISM-derived); datasets credited.
- [x] Role-based access **fails closed**. An unrecognised role header used to be
      silently rewritten to `IO`, so the typo `LEGAL-ADVISOR` granted a read-only
      Legal Advisor full write access; unknown roles now 403. Regression-tested.

## Integration Honesty
- [x] CCTNS / BharatPol shown as **mock with documented API contract**
      (`POST /mock/cctns/fir`, `GET /mock/bharatpol/lookup`, both in API_CONTRACT.md).
- [x] Pitch states production would plug into ICJS endpoints.

## Deliverables (gating)
- [x] Working prototype with **≥4 auto-generated documents** — 8 types built.
- [x] Demo: FIR→arrest, ≥2 live document generations, legal section + judgment suggestions.
- [x] Documentation (README, API_CONTRACT, user guide, code).
- [x] Dataset (anonymized legal texts, FIR samples) — `db/seed.sql` + `db/special_acts.sql`.
- [x] **Abstract** written (`ABSTRACT.md`).
- [ ] **Presentation** built and demoable. ⚠️ **STILL OPEN** — `PRESENTATION.md` is the
      slide-by-slide outline; the actual deck file does not exist in the repo.

## Automated verification
- [x] **39 backend tests passing** (`.venv/bin/python -m pytest`, ~6s, no LLM calls):
      all 8 document types produce valid .docx; SHA-256 recomputed from disk bytes
      matches the stored digest and appears in the s.63 certificate; version
      history v1→v2 with v1 superseded; RBAC allow/deny across all three roles
      including the fail-closed regression; and `audit_log` UPDATE/DELETE proven to
      raise at the database level over a raw connection that bypasses the API.
- [x] **13/13 classifier scenarios** (`python -m scripts.run_scenarios`) — separate
      from pytest because it does call the LLM.

## Deployment (verify before demo day)
- [x] Backend live on Render, `/health` returns ok.
- [ ] ⚠️ `INDIANKANOON_API_TOKEN` **not set in Render's environment** — the deployed
      instance silently serves seeded cached judgments instead of live case law.
      The token in the local `.env` is valid; it just needs adding in the dashboard.
- [ ] ⚠️ `db/special_acts.sql` **not yet applied to the Render database** — until it is,
      bribery / IT Act / NDPS / Arms Act / POCSO cases classify to zero sections there.
- [ ] Optional: `python -m scripts.embed_statutes` on the deployed DB to switch
      retrieval from keyword to pgvector semantic search.
- [ ] ⚠️ **Groq free tier is 200,000 tokens/day** — roughly 25-40 analyses. A full
      afternoon of testing exhausted it, and a hands-on judge will too. Mitigations,
      in order: (a) set **`NVIDIA_API_KEY`** so a quota 429 fails over to NVIDIA NIM
      instead of degrading — verify with `python -m scripts.check_providers`;
      (b) a paid Groq tier. When neither is available the system still degrades to
      the curated mapping rather than erroring (verified 13/13 on the scenario set
      with the LLM entirely unavailable), but it extracts **no facts** and now
      correctly forces officer review instead of reporting success.
- [x] Model claim matches reality. Groq **retired** llama-3.3-70b-versatile and
      llama-3.1-8b-instant (404) and decommissioned gemma2-9b-it (400);
      **`openai/gpt-oss-120b`** is the working model and every doc now says so.
      Pitch line: it is **open-weight**, so the same pipeline can move to
      self-hosted government infrastructure — a stronger answer for a police
      deployment than a proprietary API.
