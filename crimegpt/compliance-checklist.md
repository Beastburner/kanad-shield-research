# CrimeGPT — Compliance Checklist

Tick these before the pitch. Each maps to an explicit scoring criterion.

## Legal Accuracy
- [ ] All section references use **BNS / BNSS / BSA** (zero IPC/CrPC).
- [ ] Legal suggestions retrieved from real statute text (indiacode.nic.in), not model recall.
- [ ] Case-law suggestions are real Indian Kanoon results (no fabricated judgments).
- [ ] Pre-tested classifier on **10 real crime scenarios** before the event.
- [ ] Curated fallback mapping table for common crimes (theft, fraud, assault, cybercrime).

## Document Integrity (BSA s.63)
- [ ] Every generated document carries a **SHA-256 hash**.
- [ ] Every document carries a **timestamp**.
- [ ] System auto-drafts a **Section 63 certificate (Part A)** for evidentiary docs.
- [ ] **Append-only audit log** with version history on all edits.

## Document Format Fidelity
- [ ] Templates reverse-engineered from **real Gujarat police document formats** (RTI/public samples).
- [ ] Output matches statutory field layout (not "close but wrong").

## Framing & Ethics
- [ ] All outputs labelled **"AI-assisted draft — officer review required."**
- [ ] No claim of autonomous legal authority.
- [ ] Originality: pipeline is our own (LazyCook/PRISM-derived); datasets credited.

## Integration Honesty
- [ ] CCTNS / BharatPol shown as **mock with documented API contract**.
- [ ] Pitch states production would plug into ICJS endpoints.

## Deliverables (gating)
- [ ] Working prototype with **≥4 auto-generated documents**.
- [ ] Demo: FIR→arrest, ≥2 live document generations, legal section + judgment suggestions.
- [ ] Documentation (README, user guide, code).
- [ ] Dataset (anonymized legal texts, FIR samples).
- [ ] **Abstract** written.
- [ ] **Presentation** built and demoable.
