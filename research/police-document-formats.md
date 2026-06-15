# Research — Indian Police Document Formats (for template reverse-engineering)

> Goal: reverse-engineer the field layout of the three priority CrimeGPT documents so the
> generation engine (docxtpl) outputs a structurally faithful form. All procedure is **BNSS
> 2023** (NOT CrPC). Where the exact statutory form is set by State rules (not the bare act),
> that is flagged so a human/lawyer confirms the Gujarat-specific layout before the demo.

---

## A. Chargesheet / "Purvani" — Final Report under BNSS s.193

- **Governing provision:** BNSS **Section 193** — "Report of police officer on completion of
  investigation" (successor to CrPC s.173). The report is filed with the Magistrate empowered
  to take cognizance.
  - Source: https://www.drishtijudiciary.com/current-affairs/section-193-of-bnss
  - Source: https://thelawgist.org/report-of-police-officer-on-completion-of-investigation-section-193-of-bnss/
- **Form prescription:** s.193 says the report shall be in the **form prescribed by the State
  Government**. So the *exact* boxed layout (the "Purvani"/charge-sheet proforma) is a **State
  form**, not printed in the bare act. The bare act fixes the mandatory *contents*; Gujarat
  Police use their own proforma (and CCTNS auto-generates a version).
  - ⚠️ FLAG: get the actual Gujarat Police charge-sheet proforma via RTI / a real sample
    (see sources below) to lock the precise box order. Bare-act contents below are reliable.

### Mandatory contents (from BNSS s.193 — reliable)
1. Names of the parties.
2. Nature of the information.
3. Names of the persons who appear to be acquainted with the circumstances of the case
   (witnesses).
4. Whether any offence appears to have been committed and, if so, by whom.
5. Whether the accused has been arrested.
6. Whether the accused has been released on his bond or bail bond.
7. Whether the accused has been forwarded in custody under s.190.
8. Whether the report of medical examination of the woman has been attached (in relevant
   sexual-offence cases).
9. **s.193(3): sequence of custody / chain of custody of electronic devices** (NEW in BNSS —
   worth showing in the demo). The officer must record the custody trail of any electronic
   device seized.
   - Source: https://www.livelaw.in/articles/chain-of-custody-under-section-193-bnss-explained-519454
10. The report may be filed through **electronic communication** (NEW in BNSS).
11. Statement on whether investigation is complete; further investigation under s.193(9) is
    expressly allowed (supplementary charge-sheet).

### Timelines to surface in the document/case-diary
- Investigation to be completed without unnecessary delay; charge-sheet filing tied to custody
  limits under BNSS s.187(3): **90 days** (offences punishable with death / life / >10 yrs)
  or **60 days** (other offences).
  - Source: https://www.apnilaw.com/legal-articles/acts/section-173-crpc-vs-section-193-bnss-charge-sheet-filing-time-limits-explained/
- BNSS adds duty to inform informant/victim of progress within **90 days**.

### Practical proforma sections (typical charge-sheet box layout — confirm vs Gujarat form)
- District / Police Station / Charge-sheet (Final Report) No. & date / Year.
- FIR No., date, and the BNS section(s) in the FIR vs sections now charged.
- Final report type: charge-sheet (offence made out) vs **closure / "B" summary** vs untraced.
- Court to which submitted.
- Complainant details; accused details (name, parentage, address, age, occupation, arrest
  date, custody/bail status) — one block per accused.
- Property/articles seized (links to seizure memo).
- Witness list (with category: complainant, eye-witness, panch, expert, IO).
- Brief facts / gist of the case ("Purvani" narrative).
- Sections charged (BNS substantive + any special-law sections).
- IO name, rank, signature; SHO endorsement.

### Sources for real samples (to reverse-engineer the exact form)
- LawSikho charge-sheet-under-BNSS format guide:
  https://lawsikho.com/blog/charge-sheet-under-bnss-format-procedure-guide/
- MyJudix chargesheet under BNSS:
  https://www.myjudix.com/post/chargesheet-under-bnss-bharatiya-nagarik-suraksha-sanhita
- "Final Report & its Disposal (s.193(3) BNSS)" PDF:
  https://lawhelpline.in/wp-content/uploads/2026/02/Final-Report.pdf
- ⚠️ RTI route: file an RTI to Gujarat Police / Ahmedabad City Police for the blank
  charge-sheet proforma, or pull a redacted real charge-sheet from a public court order on
  Indian Kanoon. **Do this before the demo to claim "real format."**

---

## B. Remand Request / Police Custody Remand Application — BNSS

- **Governing provision:** BNSS **Section 187** — "Procedure when investigation cannot be
  completed in twenty-four hours" (successor to CrPC s.167). This is the basis for the police
  forwarding the accused to the Magistrate and praying for remand (police or judicial custody).
  - Source: https://theoryofabrogation.com/sec-187-bnss-corresponds-to-sec-167-crpc-procedure-when-investigation-cannot-be-completed-in-twenty-four-hours/
  - Source: https://www.sairamlawassociates.in/post/section-167-crpc-section-187-bnss-police-and-judicial-remand-explained
- **Related:** BNSS **s.190** (forwarding accused), and the case-diary requirement under s.187.
- **Custody-period rules to bake into validation (verified):**
  - Total detention authorised: up to **15 days police custody**, which under BNSS may be taken
    in parts **within the first 40 days** (offence ≤10 yrs) or **first 60 days** (offence >10
    yrs) of remand — a key BNSS change from CrPC.
    - Source: https://jurigram.com/advocates/resources/new-laws/section-187-bnss-remand-police-custody-period
    - Source (SC affirms 40-day window for ≤10 yr offences):
      https://www.livelaw.in/top-stories/s187-bnss-supreme-court-affirms-hc-judgment-that-police-custody-must-be-within-first-40-days-for-offences-punishable-upto-10-yrs-imprisonment-280315
  - ⚠️ FLAG: the exact split-custody arithmetic has active litigation; have a lawyer confirm
    the demo's worked example. Default-bail limits (60/90 days) under s.187(3).
- **Form prescription:** there is **no single statutory proforma** in the bare act; the remand
  application is a court-filing drafted by the IO/PP. The fields below are the standard
  practice fields (confirm against a real Gujarat application).

### Standard fields (remand application)
- Court heading: "In the Court of the [Judicial Magistrate First Class / Metropolitan
  Magistrate], [place]."
- Crime/FIR No., year, Police Station, district.
- BNS / special-law sections invoked.
- Applicant: Investigating Officer name, rank, PS.
- Accused: name, parentage, age, address; date & time of arrest; date & time of production.
- Type of custody prayed for: **Police Custody Remand (PCR)** vs **Judicial Custody (JC)**.
- Number of days of custody requested.
- Grounds for remand: specific investigative steps requiring custodial interrogation
  (recovery, identification, confrontation, technical analysis) — must be concrete, not
  boilerplate (courts reject vague grounds).
- Statement that case diary is produced (s.187 / s.192 case diary).
- Whether earlier remand granted; days already in custody; cumulative custody computation.
- Prayer clause; IO signature; date; verification.

### Sources / samples
- Section 187 BNSS remand & custody period:
  https://jurigram.com/advocates/resources/new-laws/section-187-bnss-remand-police-custody-period
- Default bail s.187(3) guide:
  https://bhattandjoshiassociates.com/default-bail-under-bnss-section-187-comprehensive-guide-with-latest-high-court-rulings-2026/
- ⚠️ No public statutory proforma found. RTI / real-application sample needed to claim exact
  Gujarat layout. Fields above are practice-standard and safe for a "draft for officer review."

---

## C. Seizure Receipt / Seizure Memo (Panchnama) — BNSS

- **Governing provisions (verified — note: NOT s.497):**
  - BNSS **Section 105** — recording of search & seizure (incl. preparation and signing of the
    seizure list) through **audio-video electronic means** (preferably mobile phone) and
    forwarding the recording to the Magistrate. NEW mandatory videography requirement.
    - Source: https://www.livelaw.in/articles/recording-of-search-and-seizure-electronic-mode-section-105-bnss-281366
    - Source: https://taxguru.in/corporate-law/section-105-bnss-constitutional-recalibration-search-seizure-jurisprudence.html
  - BNSS **Section 103** (search of place — list of things seized to be made and signed by
    witnesses; occupant given a copy) and **Section 106/107** (seizure of property, report to
    Magistrate, disposal). Two independent witnesses required.
    - Source: https://thelegalquotient.com/criminal-laws/bharatiya-nagarik-suraksha-sanhita/miscellaneous-provisions-relating-to-searches-ss-105-to-109-bnss/
    - Source: https://www.rvrattorneys.com/seizure-safeguards-and-transparency-how-the-bnss-rewrites-police-seizure-law/
  - ⚠️ FLAG: exact mapping of "seizure memo" to s.103 vs s.106/107 vs s.185 (search by IO)
    depends on whether the seizure is during a search, on production, or on arrest. Confirm the
    operative section per scenario with a lawyer. The witness-signing + videography rule is the
    key BNSS-new feature to showcase.

### Standard fields (seizure memo / panchnama)
- Heading: "Seizure Memo / Panchnama," Police Station, district.
- Crime/FIR No., year, BNS section(s).
- Date, time, and place of seizure.
- Seizing officer: name, rank, PS.
- Person from whom seized: name, parentage, address (or "found at scene").
- **Itemised list of seized property** — serial no., description, make/model, identifying
  marks, quantity, estimated value, condition. (For electronic devices: IMEI / serial /
  MAC, and **SHA-256 hash** of imaged data — ties to BNSS s.193(3) chain of custody + BSA s.63.)
- Manner of packing/sealing; seal description.
- **Two independent panch witnesses** — names, parentage, addresses, signatures.
- Statement that an **audio-video recording** was made (s.105) and forwarded to the Magistrate.
- Signature of person from whom seized (acknowledgement) + copy-given endorsement.
- Seizing officer signature; date.

### Sources / samples
- BNSS s.105 audio-video search/seizure recording (above).
- Seizure-memo witness-signature precedent (Parliament library doc):
  https://eparlib.sansad.in/bitstream/123456789/27151/1/11_II_10091996_p132_p132_t243.pdf
- ⚠️ RTI / real panchnama sample needed for exact Gujarat layout.

---

## Build note
For all three, the bare-act **contents** are reliable and safe to template now. The exact
**boxed proforma** is State-prescribed for the charge-sheet and practice-drafted for remand /
seizure — so the demo claim should be: *"fields are statutorily grounded under BNSS s.193 /
s.187 / s.105; the visual proforma is reverse-engineered from public samples and is being
validated against the Gujarat Police form."* Label every output **"AI-assisted draft — officer
review required."**
