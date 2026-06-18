# CrimeGPT — Presentation Deck (content + speaker notes)

**Kanad S.H.I.E.L.D. 2026 · PS-69EEFDFB90B99 — AI-Powered Automation for Crime
Documentation and Legal Intelligence**

> Build the actual slides in PowerPoint/Google Slides/Canva from this outline. Each
> slide below = one slide. "Notes" = what you say. Keep slides visual; the demo is
> the centrepiece (slides 7–8). Target ~10 minutes + 3-minute live demo.

---

## Slide 1 — Title
- **CrimeGPT** — AI-Assisted Crime Documentation & Legal Intelligence
- PS-69EEFDFB90B99 · Team name · Kanad S.H.I.E.L.D. 2026
- One line: *"From FIR to court-ready case file — grounded in the new criminal laws,
  reviewed by the officer."*
- **Notes:** Greet the panel (police + officials). State the one line and move on —
  the demo earns the points, not the intro.

## Slide 2 — The Problem (their pain, in their words)
- An IO re-enters the same data — names, addresses, items, statements — across the
  charge sheet, remand request, seizure receipt, custody & medical letters.
- Identifying the right provisions is now harder: **IPC/CrPC/IEA → BNS/BNSS/BSA**
  (in force since 1 July 2024).
- Result: hours of duplicate typing, transcription errors, wrong/old sections.
- **Notes:** Anchor in the officer's day. Don't pitch AI yet — pitch the pain.

## Slide 3 — Our Solution (one screen, one sentence)
- One **FIR narrative in** → unified case-data pool → **sections + case-law + all
  documents out**, each evidence-stamped, with a case diary — **officer reviews
  and signs**.
- Tagline: *"We assist, we don't replace judgment."*
- **Notes:** This is the whole product in one breath. Everything later is proof.

## Slide 4 — Why We're Different: No Hallucinated Law
- **4-stage anti-hallucination pipeline**: Extraction → RAG Classification →
  Validation → Generation.
- Sections come **only** from retrieved BNS bare-act text, not model memory; an
  independent validator drops anything that doesn't fit (fail-closed).
- **Curated BNS fallback safety-net** if the model misfires live — never a blank screen.
- **Notes:** This is the credibility slide. Say: *"No single LLM output reaches the
  officer unchecked."*

## Slide 5 — Lawful & Evidence-Grade
- Charges always **BNS/BNSS/BSA**; each shows its **IPC/CrPC cross-reference** for
  familiarity + old case-law lookup.
- Every document: **SHA-256 hash + timestamp + auto-drafted BSA Section 63 (Part A)
  certificate** → admissible from the moment it's produced.
- Append-only **audit log** + document **version history**.
- **Notes:** Police judges care about admissibility. Most teams won't have s.63 — lead with it.

## Slide 6 — Architecture (one clean diagram)
- FIR → [Extraction] → [Classification + RAG over BNS/BNSS/BSA corpus + Indian
  Kanoon] → [Validation] → [Document Generation] → SHA-256 + s.63 + audit/diary.
- Stack chips: FastAPI · Groq LLaMA-3.3-70B · PostgreSQL + pgvector · python-docx ·
  Tesseract OCR · OpenCV · React + MUI.
- **Notes:** Point, don't read. 15 seconds. Then move to the demo.

## Slide 7 — LIVE DEMO (part 1)  ⭐
- New Case → paste/Import-from-CCTNS an FIR → **Analyze**.
- Show: extracted facts (editable) · BNS sections with **confidence + IPC cross-ref**
  · Indian Kanoon judgments · the disclaimer.
- **Notes:** Narrate as an officer would. Edit one fact, re-analyze to show it updates.
  Keep the demo in **English** for reliability.

## Slide 8 — LIVE DEMO (part 2)  ⭐
- Generate **≥2 documents** live (chargesheet + remand) → show **SHA-256**, download
  `.docx`, download **s.63 certificate**.
- Case Diary → FIR→arrest timeline filling in.
- **Notes:** This is where you win. Open one generated .docx so they see a real,
  formatted police document. Show the s.63 cert.

## Slide 9 — Built for a Non-Technical Officer
- Top-to-bottom case-file workflow, big clear controls, every AI output labelled
  *"AI-assisted draft — officer review required."*
- **Multilingual** UI + document output: English / Hindi / Gujarati (show the switcher).
- **Notes:** Flip the language switcher to Gujarati on one screen — local language scores.

## Slide 10 — Innovation & Integration-Readiness
- Evidence upload with **hashing + tagging**, demonstrative **face matching**, **OCR**
  ingestion of scanned FIRs.
- **Role-based access** (IO / SHO / Legal Advisor) — every action attributable.
- **Mock CCTNS / BharatPol** with documented API contracts → production plugs into ICJS.
- **Notes:** Stress the mocks are *honestly labelled* and contract-documented — not faked.

## Slide 11 — Deliverables & Compliance
- ✔ 8 document types (req. ≥4) · ✔ ≥2 live generations · ✔ section + judgment
  suggestions · ✔ case diary · ✔ search/audit · ✔ multilingual.
- ✔ Abstract · ✔ README/docs · ✔ dataset (anonymized bare-act + FIR samples) · ✔ demo.
- **Notes:** Tick these out loud — they map 1:1 to the scoring sheet.

## Slide 12 — Roadmap & Ask
- Next: live Indian Kanoon API, real Gujarat proforma templates, offline mode,
  semantic retrieval at scale (pgvector embeddings).
- Production: ICJS/CCTNS integration, on-prem deployment.
- Close: *"Lawful, grounded, evidence-grade, and usable by a real officer — today."*
- **Notes:** End on deployability, not features. Thank the panel; invite questions.

---

### Demo safety checklist (read before going on stage)
- Backend running; `GROQ_API_KEY` set; DB seeded; `GET /health` returns ok.
- Role set to **IO** (not Legal Advisor — that role can't file documents).
- One known-good FIR pre-loaded as a fallback if typing fails.
- Core demo in **English**; show Gujarati switch on just one screen.
- If analysis returns review-required, the **curated fallback** still shows sections —
  don't panic, point to it as a designed safety-net.
