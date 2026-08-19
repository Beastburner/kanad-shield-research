# CrimeGPT

**AI-Assisted Crime Documentation and Legal Intelligence**
**PS-69EEFDFB90B99 · Kanad S.H.I.E.L.D. 2026 · Cyber Crime Branch, Ahmedabad City Police**

---

# 1. The problem, in an officer's words

An Investigating Officer who registers a theft today will, over the life of that
case, write the complainant's name, the accused's name, the address, the seized
property and the sequence of events **seven times over** — in the charge sheet,
the remand request, the seizure receipt, the custody letter, the medical
requisition, the panchnama and the identification form.

Every re-typing is an opportunity for a discrepancy. And a discrepancy between two
documents in the same case file is exactly what defence counsel is looking for.

The work has become harder, not easier. On **1 July 2024** the Indian Penal Code,
the Criminal Procedure Code and the Indian Evidence Act were repealed and replaced
by the **BNS, BNSS and BSA**. An officer must now charge under a code they are
still learning, while remembering the old section number in order to find the case
law — because thirty years of judgments are indexed under the old numbers.

**CrimeGPT addresses exactly this gap.** The officer enters the FIR narrative
once. The system proposes the applicable legal sections, shows the old section
alongside each new one, finds relevant judgments, and produces every document from
that single pool of facts — each one stamped for evidentiary use. The officer
reviews, corrects and signs. **The system suggests. The officer decides.**

---

# 2. What it does, end to end

**Step 1 — The FIR comes in.** Typed, imported from a records system, or
photographed. A scanned FIR is read automatically, and at the same moment it is
checked for signs of editing and its digital fingerprint is recorded.

**Step 2 — The system reads the case.** It extracts the complainant, the accused,
the property, the location, the dates and the sequence of events into one shared
record. Every field is editable — if the system misreads a name, the officer
corrects it once and the correction flows to every document.

**Step 3 — It proposes the law.** For each suggested section the officer sees four
things: the section and its heading, the **actual text of the law** it is drawn
from, a confidence figure, and the **repealed section it corresponds to** — so
BNS 303 appears with "cf. IPC 378/379" beside it. Relevant judgments follow.

**Step 4 — It produces the documents.** Nine document types, generated from the
reviewed facts. No re-typing, and no possibility of the accused's name differing
between the charge sheet and the remand request.

**Step 5 — It makes them evidence-grade.** Every document carries a digital
fingerprint and a draft certificate under **Section 63 of the Bharatiya Sakshya
Adhiniyam** — the provision governing the admissibility of electronic records.
Regenerating a document creates a new version; the old one is retained, never
overwritten.

**Step 6 — It keeps the record.** A chronological case diary from first complaint
to arrest, and an audit trail recording every action and who took it.

---

# 3. STATUS — what is working, what is simulated, what is not built

This is the honest inventory. Nothing below is aspirational.

## 3.1 Fully working

| Capability | Notes |
|---|---|
| Single shared case record | Entered once, reused across all documents; editable, and every edit attributed |
| Legal section suggestions | BNS/BNSS/BSA **plus** special acts, drawn from actual statute text held in our database |
| Old-code cross-references | Every mapping checked against the official concordance — **44 of 44 correct** |
| Judgment suggestions | Live from the Indian Kanoon legal database, filtered to courts and tribunals |
| **Nine** document types | Requirement was four. Listed in §4 |
| Digital fingerprint (SHA-256) | On every document, verified against the file itself in our tests |
| Section 63 certificate | Auto-drafted Part A; Part B deliberately left for the forensic expert |
| Version history | Old versions retained and marked superseded, never deleted |
| Audit trail | Enforced by the database itself — entries cannot be altered or deleted by anyone |
| Case diary | Automatic events plus manual officer entries |
| Search | By case number or by keyword across narratives |
| Three languages | English, Hindi, Gujarati — both the screen and the generated documents |
| Reading scanned FIRs | Photographs and PDFs, in English |
| Document tamper screening | Flags signs a file was edited after creation — see the caveat in §3.2 |
| Duplicate FIR detection | Catches the same FIR registered twice, even if re-scanned and slightly different |
| Role-based access | Investigating Officer, Station House Officer, Legal Advisor — enforced by the system, not merely hidden on screen |
| Evidence upload | Files fingerprinted the moment they are received, with officer tagging |
| Works without internet | The application shell and previously-viewed cases remain available offline |

## 3.2 Working, but with an honest limit — say these plainly

| Capability | The precise limit |
|---|---|
| **Document formats** | Structurally faithful and grounded in the bare acts, but **not** the exact State-prescribed proforma. Gujarat prescribes Form C.P.C. 20 for the charge sheet. We have mapped the field-by-field difference in a 923-page-equivalent research document. |
| **Tamper screening** | This is **triage, not forensics**. It tells an officer a document deserves a closer look. A certified opinion is the Forensic Science Laboratory's function under Section 79A of the IT Act — which is the same reason we leave Part B of the s.63 certificate blank. |
| **Face matching** | Face *detection* is genuine. Face *matching* is a demonstrative comparison to show the workflow — it is **not** forensic identification, and the screen says so. |
| **Reading scanned Gujarati/Hindi FIRs** | Typed Gujarati and Hindi work fully. *Scanned* documents in those scripts need an additional language pack installed on the server. |
| **Speed** | An analysis takes about 4–5 seconds. The very first analysis after a restart takes longer while a component loads. |

## 3.3 Deliberately simulated (the problem statement permits this)

| Simulated | How we handle it honestly |
|---|---|
| **CCTNS integration** | Returns a realistic FIR record, labelled `MOCK` in the response itself, with the full technical contract published so a production connection to ICJS is a configuration change, not a rebuild. |
| **BharatPol lookup** | Returns a simulated Interpol notice for **one seeded name only**. Any other name returns nothing — a deliberate ethical guard so a live demonstration can never fabricate a notice against a real person. |

## 3.4 Not built — and why

| Not built | Reason |
|---|---|
| Real user authentication | No identity provider in scope for a hackathon build. Roles are enforced and every action is attributed; production adds a login layer without changing the permission model. |
| Officer validation of our legal mappings | Our ground truth is the official concordance, audited and fully traceable. Sign-off by a serving officer is the first item on our production path. |
| The State's prescribed proformas | Requires the actual sample forms, which need an RTI request or departmental access. The gap is documented, and each document is built by one isolated routine — swapping a layout is a change of template, not of architecture. |
| Second AI provider as a live safety net | The code is written and tested; the provider account is not yet serving requests, so **we do not count it as a working mitigation.** |
| Large-scale accuracy study | We have depth of testing rather than breadth — see §6. |

---

# 4. The nine documents

| Document | Legal basis |
|---|---|
| Charge sheet (final report) | BNSS s.193 |
| Remand request (police custody) | BNSS s.187 |
| Seizure receipt / panchnama | BNSS ss.103, 105, 106 |
| Court custody letter | BNSS s.187(2) |
| Arrest panchnama | BNSS s.105 |
| Medical examination requisition | BNSS s.51 |
| Accused face identification form | Investigation aid — states on its own face that it is **not** a Test Identification Parade |
| Data request to Meta / WhatsApp (LERS) | BNSS s.94 read with the IT Act |
| **Notice for Appearance** | **BNSS s.35(3) — Second Schedule, Form No. 1** |

**The last one deserves a sentence.** We read the entire Second Schedule of the
BNSS and found it contains 58 prescribed forms — and **none** of the standard
police documents is among them; it is almost entirely court-issued instruments.
Exactly one police investigative form exists in the whole Schedule. We implement
it word for word. It is our one document at complete statutory fidelity, and the
finding also answers the criticism before it is made: for most of these documents,
**no prescribed central form exists to deviate from.**

---

# 5. Why it can be trusted — in plain terms

Three failures matter in a system like this: inventing a law, using a repealed
law, and inventing a judgment. We prevent each by design, not by hoping.

**It cannot invent a section.** When the system proposes sections, it is not asked
"what law applies?" and trusted to answer well. It is handed a short list of
sections retrieved from our database and told to pick from that list by reference
number. Anything outside the list is discarded automatically before a person sees
it. It cannot cite a law it was not shown — the same way an officer working from a
bare act cannot cite a section that is not printed in the book in front of them.

**A second check removes anything unproven.** An independent stage re-examines
each proposed section against the actual statutory text. **Anything it cannot
positively confirm is removed, not merely flagged.** When in doubt, the system
shows less, never more.

**It cannot invent a judgment.** Case law comes from searching the Indian Kanoon
database. There is no step anywhere in that path that writes text — so there is
nothing that *could* fabricate a citation.

**It cannot be talked into misbehaving.** The FIR narrative is treated strictly as
evidence, never as instruction. We tested this with an FIR containing a hidden
instruction to charge murder and cite a fabricated judgment. It was ignored.

**It says so when it is struggling.** If the AI service is unavailable, the system
falls back to a verified reference table — and it *announces* this, marks the
result as requiring officer review, and refuses to present it as a confident
answer. A degraded result never masquerades as a good one.

**Nothing is asserted as final.** Every output is labelled *"AI-assisted draft —
officer review required."* Facts are editable, every edit is attributed, and the
audit trail cannot be altered.

---

# 6. What we measured

A working demonstration proves a system runs. It does not prove it is right. So we
measured.

## The comparison that matters most

We asked the **same AI model** the **same FIRs** with our safeguards switched off
— which is what a team gets by simply asking an AI for the answer.

| | AI alone | CrimeGPT |
|---|---|---|
| Cited **repealed** law as the charge | **6 out of 6** | Never — structurally impossible |
| Gave the correct current section | **0 out of 6** | Correct in all 13 test scenarios |
| Contradicted itself on case law | Same case, **3 conflicting citations** | Cannot occur — it does not write citations |

Asked for the applicable law on a theft, the unguarded AI answered *"Section 379
IPC"* — a section that ceased to exist in 2024. On a murder, *"Section 302 IPC."*
Not occasionally. Every single time.

Asked for supporting judgments it produced *"Mohan Lal v. State of Uttar Pradesh"*
with **three different and mutually incompatible citations**. At most one can be
real.

**This is the entire case for the project in one table.** The danger is not that
AI is useless for police work — it is that AI is *confidently wrong* about
recently changed law, in a domain where being confidently wrong loses cases. The
safeguards are the product.

## The rest of the evidence

- **52 automated checks** run in about twenty seconds, covering document
  generation, fingerprint integrity, version history, access control, and the
  tamper-proofing of the audit trail.
- **13 realistic crime scenarios** — theft, robbery, burglary, cyber fraud, breach
  of trust, assault, intimidation, extortion, forgery, bribery, narcotics,
  firearms — with the expected sections **written down before** the system was
  tested against them, and an automatic failure if any repealed section ever
  appears as a charge.
- **Seven deliberate attempts to break it.** Six held. The seventh — a purely
  civil boundary dispute — produced a suggestion *with* a warning attached rather
  than refusing outright. We disclose that rather than hide it.
- **44 of 44** old-code cross-references audited against the official concordance.
- **We tested our own tests.** We deliberately broke the system — disabled the
  fingerprinting, disabled access control — to confirm the checks actually caught
  it. Tests that pass against broken software are worse than no tests at all.
- **We publish the bugs we found ourselves**, because finding them is the evidence
  that the process works: an access-control flaw where a mistyped role granted
  more permission than intended; a legal search that returned an Act instead of a
  judgment; a keyword rule that matched the word "**mob**ile" and classified a
  motorcycle theft as rioting. All found by us, all fixed, all now permanently
  guarded by a test.

---

# 7. Is it deployable, or is it a demonstration?

- The AI model is **open-weight**, meaning the same system can run on government
  hardware rather than depending on an external company's service.
- The database is standard PostgreSQL — it moves to any government or commercial
  host without modification.
- The simulated integrations are published with full technical contracts, so
  connecting to the real ICJS network is configuration, not redevelopment.
- What genuinely remains before a police station could use this: **the State's
  prescribed forms, validation of the legal mappings by serving officers, and a
  security review.** Every one of those is named in our documentation. **None of
  them is architectural.**

---

# 8. Sources

- **indiacode.nic.in** — the official text of the BNS, BNSS and BSA (Acts 45, 46
  and 47 of 2023), including the complete Second Schedule of forms.
- **The official BNS–IPC concordance** — the basis of every cross-reference.
- **Gujarat Police Manual, Volume III** — rules 180(4), 218, 231 and 232, covering
  panchnama form, remand forwarding and the prescribed charge-sheet forms.
- **NCRB Integrated Investigation Forms** — IIF-III (arrest), IIF-IV (seizure),
  IIF-V (charge sheet).
- **Indian Kanoon** — judgments, retrieved live; never generated.
- **Meta Law Enforcement Guidelines** — the lawful scope of a platform data
  request.

Full citations with sources and confidence ratings accompany this document in our
format-research paper.

---

**CrimeGPT is lawful by construction, grounded in real statutory text, evidence-grade
from the moment a document is created — and honest about precisely where its
authority ends.**
