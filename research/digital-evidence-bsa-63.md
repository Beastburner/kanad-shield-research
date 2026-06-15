# Research — Digital Evidence Admissibility (BSA Section 63)

> "Quality and admissibility of digital evidence" is an EXPLICIT scoring criterion in BOTH
> our PSs. Almost no student team knows the BSA Section 63 mechanics. Building this in is a
> credibility multiplier with cybercrime-cop judges.

---

## The Governing Provision

- Under the **Bharatiya Sakshya Adhiniyam, 2023 (BSA)**, admissibility of electronic records
  is governed by **Section 63** (successor to the old **Section 65B** of the Indian Evidence Act).
- **Section 61** — electronic/digital records cannot be denied admissibility solely because
  they're electronic; they have the same legal effect as other documents (subject to s.63).
- **Section 62** — contents of electronic records proved per Section 63.

## Section 63 Requirements

- Electronic evidence must be accompanied by a **certificate in a prescribed format**
  (the format is now specified in the **BSA Schedule** — a change from the old regime).
- The Schedule certificate has **two parts**:
  - **Part A** — filled by the party producing the electronic record (firsthand info on
    creation, storage, preservation; establishes chain of custody).
  - **Part B** — filled by an **Expert** (technical aspects: format, encryption, integrity).
- **Section 63(4)(c)** — emphasises the certificate requirement; in practice courts expect
  forensic support.

## Authentication Pillars (what makes evidence stick)

1. **Hash values** (e.g., SHA-256) — digital fingerprint to verify integrity and detect tampering.
2. **Documented chain of custody** — tracked from acquisition to courtroom.
3. **Expert testimony / certificate** — validates collection and preservation.
4. **Metadata preservation** — timestamps, source verification.

> Courts increasingly EXPECT forensic procedures (hash verification, chain of custody,
> technical documentation) even though forensic exam isn't strictly mandatory — they
> strengthen the s.63 certificate and reduce challenge risk.

---

## Direct Build Implications

### CrimeGPT
- Every generated document → attach **SHA-256 hash + timestamp**.
- Auto-generate a **draft Section 63 certificate (Part A)** alongside any evidentiary doc.
- Maintain an **append-only audit log** (version history) — the PS explicitly demands it.

### Child Protection
- Captured chat logs / suspicious interactions → store with **hash + timestamp + chain of
  custody metadata** so they're admissible.
- "Secure evidence storage for police use" = tamper-evident store + s.63-ready certificate.
- This is exactly what the PS means by "quality and admissibility of digital evidence."

## Caveats To Acknowledge In Pitch (shows maturity)

- Section 63 assumes a single identifiable device; cloud/third-party data is harder.
- Courts have accepted certification based on the user's device as accessed.
- Compliance is **mandatory** but timing of the certificate has some judicial flexibility
  (objections must be timely). Don't overclaim "fully automated court-ready evidence" —
  say "court-admissibility-ready, pending the statutory expert certification."

## Sources

- livelaw.in, drishtijudiciary.com: e-evidence under BSA 2023.
- gcatg.org, corpotechlegal.com: Section 63, certificate & hash value.
- bhattandjoshiassociates.com: s.63 certificate requirements + SC interpretation (2026).
- proaxissolutions.com, cyberprivilege.com: Section 63(4)(c) certification in practice.
