# Child Protection — Compliance Checklist

## DPDP Act (children's data) — the lawful basis
- [ ] Architecture framed as **real-time child-safety service** (invokes DPDP safety exemption).
- [ ] **Parental consent dashboard** present as the control centre.
- [ ] **Separate child / adult data pipelines** (isolated DB schemas).
- [ ] **Pseudonymous / least-intrusive** processing by default.
- [ ] Child PII **encrypted** (field-level).
- [ ] **Consent withdrawal as easy as granting** it.
- [ ] **Age-assurance + parent-child account linking** implemented.
- [ ] Consent-verification trail / logs maintained (DPB readiness).
- [ ] No targeted advertising / behavioural profiling of minors.

## POCSO + IT Act — the reporting duty
- [ ] AI grooming/abuse flag **auto-triggers POCSO s.19 reporting workflow**.
- [ ] Report routes to **Cyber Crime Branch** (mock) / references Childline 1098, 155260.
- [ ] Grooming detection mapped conceptually to **IT Act s.67B** + **POCSO s.11/13–15**.
- [ ] Aligned with **IT Rules 2021** (incl. Feb 2026 amendments) takedown posture.

## BSA s.63 — evidence admissibility
- [ ] Captured chat logs stored with **SHA-256 + timestamp + chain-of-custody metadata**.
- [ ] Tamper-evident "secure evidence storage for police use."
- [ ] Draft **Section 63 certificate (Part A)** generated for captured evidence.

## Integration honesty
- [ ] CCTNS / **TrackChild** (missing-child DB) / ERSS-112 shown as **mocks** with contracts.
- [ ] Pitch states production plugs into ICJS / real endpoints.

## Deliverables (gating)
- [ ] Working prototype/demo (hero flow).
- [ ] **Police dashboard demonstration.**
- [ ] Documentation (architecture, workflow, integrations).
- [ ] Deployment instructions / container setup (optional).
- [ ] **Abstract** written.
- [ ] **Presentation** built and demoable.

## Safety / ethics
- [ ] Demo uses a **controlled synthetic dataset**, never real children's data.
- [ ] No OS-level interception requiring device compromise.
- [ ] Facial recognition kept out of core (optional bonus at most).
