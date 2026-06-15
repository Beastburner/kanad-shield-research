# Research — Govt Systems Integration (CCTNS / ERSS-112 / TrackChild)

> Both PSs mention CCTNS / ERSS integration. The honest reality: these are CLOSED govt
> systems with NO public developer API. Both PSs explicitly say "simulated if required."
> So we MOCK them cleanly with documented API contracts. Don't waste time chasing real access.

---

## CCTNS (Crime and Criminal Tracking Network & Systems)

- Flagship MHA e-governance project (launched 2009), under the National e-Governance Plan.
- By 2024–2025: **all ~17,130–17,712 police stations** nationwide connected; manages
  **35+ crore** crime/criminal records.
- Handles FIR registration, criminal record management, investigation tracking.
- **99.9%** of police stations register FIRs directly on it.
- Integrates with: **NAFIS** (fingerprints), **AFRS** (facial recognition), Vaahan & Saarthi
  (MoRTH), Arms Licenses (MHA), Passport (MEA), IVFRT, and **TrackChild** (MWCD).
- Part of **ICJS** (Interoperable Criminal Justice System).

> **NO public API.** Closed government system. Access is govt-gated.
> ACTION: Build a mock CCTNS REST endpoint returning realistic FIR / record responses.

## ERSS-112 (Emergency Response Support System)

- National single emergency number (India's "911").
- Free **'112 India' mobile app** (Play Store / App Store); panic-call via long-press 5/9.
- SOS email / alert to state Emergency Response Centre (ERC).
- **Has an API** that state systems integrate against (e.g., Bihar's 102 ambulance line
  integrating with 112 via API, coordinated by C-DAC).
- Related: **ITSSO** (Investigation Tracking System for Sexual Offences), **Safe City** project
  — Ahmedabad is one of 8 Safe City cities (Nirbhaya Fund).

> Access is govt-gated. ACTION: Mock the ERSS-112 SOS dispatch with a documented contract.

## TrackChild (Ministry of Women & Child Development)

- The actual **missing-child database** the Child Protection PS references.
- CCTNS integrates with it.
> ACTION: Reference TrackChild as our "missing child database" integration target; mock it.

---

## How To Handle Integrations In The Build & Pitch

1. Build clean **mock services** (FastAPI/Express) that emulate CCTNS / ERSS-112 / TrackChild
   responses with realistic JSON.
2. Define a **documented API contract** for each (OpenAPI/Swagger) — "integration-ready."
3. In the pitch: *"Production deployment plugs into the real CCTNS/ERSS endpoints via the
   ICJS framework; for this prototype we simulate them per the problem statement's allowance,
   against a documented contract."*
4. This is **expected and explicitly permitted** ("simulated if required") — not a weakness.

## Sources

- grokipedia.com, mha.gov.in, digitalpolice.gov.in: CCTNS scope & integrations.
- data.gov.in: CCTNS open data.
- gulfnews.com, pressreader.com (HT): ERSS-112 + API integration + ITSSO + Safe City.
- ncrb.gov.in: NCRB / CCTNS.
