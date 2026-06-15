# 03 — Strategy & Positioning

## The Core Thesis

Judges are **police officers + government officials**. Student teams over-index on flashy
demos and under-index on whether the thing is **lawful, deployable, and evidence-grade**.
Our wedge is **compliance depth** — the one axis where we can out-prepare everyone.

---

## Positioning Statements (use these verbatim in pitches)

**CrimeGPT:**
> "Every legal suggestion CrimeGPT makes is mapped to the new BNS, BNSS, and BSA codes —
> not the repealed IPC/CrPC — and grounded in the actual bare-act text plus Indian Kanoon
> judgments, so it doesn't hallucinate law. Every generated document carries a SHA-256 hash,
> a timestamp, and an auto-drafted BSA Section 63 evidence certificate, so it's
> court-ready from the moment it's produced. The officer always reviews and signs — we
> assist, we don't replace judgment."

**Child Protection:**
> "A child-monitoring app is illegal by default under the DPDP Act — tracking minors is
> prohibited. We're lawful because we're built on the Act's real-time child-safety
> exemption: isolated child/adult data pipelines, a parental consent dashboard as the
> control centre, pseudonymous processing by default, and POCSO Section 19 mandatory
> reporting wired straight into the alert flow. When our AI flags grooming, the system
> doesn't just notify — it discharges a legal reporting duty."

---

## Anti-Hallucination Architecture (CrimeGPT) — Our Real Differentiator

Apply the **LazyCook 4-stage refinement pipeline** to legal AI. No single LLM output
reaches the officer unchecked:

1. **Extraction Agent** — pulls structured facts from the FIR narrative (low hallucination,
   grounded in input).
2. **Legal Classification Agent** — suggests BNS/BNSS/BSA sections, constrained to a
   retrieved statute index (RAG over bare-act text), NOT free recall.
3. **Validation/Critique Agent** — independently checks "do these sections fit these facts?"
   against the actual section text; outputs confidence + concerns; kicks back if low.
4. **Document Generation Agent** — only runs after validation clears; mostly templating with
   validated inputs.

Ground truth = retrieved statute + Indian Kanoon judgments, not model memory.
Pitch line: *"Our system never presents a single LLM's output directly."*

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| LLM suggests wrong BNS section live | Curated fallback mapping table for common crimes; pre-test on 10 real scenarios |
| Generated doc format looks "close but wrong" | Reverse-engineer real Gujarat police doc templates from public/RTI samples |
| Gujarati legal NLP breaks on stage | Keep Gujarati as bonus, demo core in English; don't let a judge break it live |
| Child app reads as illegal tracking | Frame entire architecture around DPDP safety exemption + parental consent |
| CCTNS/ERSS "integration" looks faked | Mock cleanly with documented API contract; PS explicitly allows "simulated if required" |
| Missing abstract/presentation | Build these FIRST — they're disqualifying |

---

## Scope Discipline (the hardest part)

- **CrimeGPT:** build 2–3 documents flawlessly, not all 7 half-broken. One perfect
  FIR→charge-sheet→remand flow beats seven shells.
- **Child Protection:** one clean end-to-end safety flow (risk detected → parent alerted →
  evidence captured with hash → report drafted to Cyber Crime Branch). Not all 9 modules.

---

## What Makes Us Credible (team assets to leverage)

- **PRISM** — multi-agent orchestration, Groq + LLaMA 3.3-70B (reuse for CrimeGPT pipeline).
- **LazyCook** — proven 4-stage refinement pattern (the anti-hallucination spine).
- **VERONICA** — FastAPI + local LLM + RAG memory (reuse RAG retrieval pattern).
- **ServiSync** — React + Leaflet + Node/MySQL (reuse for any mapping/dashboard).
