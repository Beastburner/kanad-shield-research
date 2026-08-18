# CrimeGPT — Real Document Format Research & Gap Analysis

**Scope:** the 8 document types built by `_BUILDERS` in
`crimegpt/backend/app/documents.py`.
**Purpose:** replace invented layouts with reverse-engineered real proformas, or — where no
real proforma is publicly obtainable — say so explicitly rather than invent one.
**Date of research:** 2026-08-19. **Legal regime:** BNS / BNSS / BSA (in force 1 July 2024).

> **Honesty rule applied throughout.** Every field list below is traceable to a URL. Where I
> could not find an authoritative source, the section says **NOT FOUND** and gives the
> statutory content requirements only. Nothing in this file is a plausible-looking invention.

---

## 0. Source-class legend & confidence

| Class | Meaning |
|---|---|
| **(a)** | The BNSS Second Schedule itself (primary, central) |
| **(a2)** | A BNSS section that fixes mandatory *contents* (primary, but no boxed form) |
| **(b)** | Gujarat-specific prescribed format / Gujarat Police Manual rule |
| **(b2)** | Another State's BNSS-era notified format (structurally the national CCTNS template; **not** Gujarat) |
| **(c)** | Widely-used but unofficial / CrPC-era-but-still-current template (NCRB IIF, other State police manuals) |
| **(d)** | Not found |

Confidence = how safe it is to ship the layout as "the real form" in front of Ahmedabad
Cyber Crime Branch judges.

---

## 1. PRIORITISED SUMMARY — where to spend implementation effort

| Rank | Document | Distance from correct | Why |
|---|---|---|---|
| **1** | `chargesheet` | **Very large** | A real prescribed form exists and is obtainable (Gujarat Form **C.P.C. 20** under GPM Vol. III r.231; BNSS-era State notifications; NCRB IIF-V). The current builder shares almost no structure with it: no court line, no charge-sheet number, no "type of final report", no original/supplementary flag, ~20 missing per-accused fields, no "accused not charge-sheeted" block, no documents/MO tables, no A/B/C summary. This is the document a serving officer will recognise as wrong in under five seconds. |
| **2** | `accused_panchanama` **and** `seizure_receipt` | **Large — wrong genre** | A Gujarat panchnama is a **narrative** document (GPM Vol. III r.180(4)): panch particulars → preamble → running narrative → time commenced/completed → writer's name → signatures. The builder emits key-value tables, which is the wrong document species. Separately, the real arrest and seizure field sets (NCRB IIF-III / IIF-IV) are largely absent. |
| **3** | `face_identification_form` | **Large — wrong legal instrument** | BNSS **s.54** makes identification of an arrested person a **Court-directed** process on request of the SHO, and GPM r.181 says a parade **held in the presence of police is inadmissible**. The current form is a police-signed photo-identification sheet — exactly the artefact defence counsel attacks. Must be re-scoped to (i) an application to the Court u/s 54, and/or (ii) a **descriptive roll / marks of identification** sheet (a real, prescribed chargesheet accompaniment). |
| 4 | `remand_request` | Medium | No prescribed proforma exists anywhere (correctly). But the statutory skeleton is wrong: it is a **forwarding report to the nearest Magistrate supported by case-diary copies** (BNSS s.187(1); GPM r.218(2)), not a free-standing "application". Missing 24-hour arithmetic, s.187(4) in-person production, the 15-days-in-parts / 40-or-60-day window, and the s.187(5) proviso on place of detention. |
| 5 | `court_custody_letter` | Medium | Statutory citation in `_DOC_META` is questionable: s.190 is the *evidence-sufficient forwarding* provision (chargesheet stage), not the judicial-custody provision. Judicial custody is authorised by the Magistrate under **s.187(2)**. No police-side proforma found. |
| 6 | `medical_treatment_letter` | Medium | Cites **s.51** (examination of an **accused** at police request) but the builder defaults to `facts.victims[0]`. Four legally distinct flows are being collapsed into one (s.51 accused / s.52 rape accused / s.53 mandatory exam of every arrested person / s.184 rape victim). A real requisition proforma **is** available (Puducherry Police Manual Ch. 43) and is close to Gujarat practice. |
| 7 | `lers_request` | Small | Structurally the closest to correct. Needs: re-style as a **written order under s.94(1) BNSS** (a police officer issues an *order*, not a *summons*), Meta's actual accepted identifier list, the 90-day preservation window, MLAT/letter-rogatory for content, and the IT Rules r.3(1)(j) 72-hour + "purpose and reason" language. |
| — | *(all)* | — | **Cross-cutting:** real Ahmedabad chargesheets and panchnamas are filed **in Gujarati**. An English-only artefact will read as a draft aid, not a filing. Also: the `_title_block` masthead ("GOVERNMENT OF GUJARAT / AHMEDABAD CITY POLICE · CYBER CRIME BRANCH") appears on **none** of the real forms examined — real forms start with `District / P.S. / Year / FIR No. / Date`. |

**Top 3 to implement first: `chargesheet`, `accused_panchanama` (+`seizure_receipt`), `face_identification_form`.**

---

## 2. CROSS-CUTTING FINDING — what the BNSS Schedule does and does not contain

The **BNSS Second Schedule (see section 522)** contains **58 forms, numbered 1 to 58** — it ends
at Form No. 58 and is followed by the Statement of Objects and Reasons.
Source (primary, verified by extracting the text): India Code, Act 46 of 2023 —
<https://www.indiacode.nic.in/bitstream/123456789/20099/1/A202346.pdf> (Second Schedule at
pp. 222–281 of the PDF).

**None of the 8 CrimeGPT documents has a form in the BNSS Second Schedule.** The Schedule is
overwhelmingly a set of *court-issued* instruments (summonses, warrants, bonds,
proclamations, commitment warrants). Exactly one form in the whole Schedule is a
police-issued investigative document:

> **FORM No. 1 — NOTICE FOR APPEARANCE BY THE POLICE [See section 35(3)]**
> Fields, verbatim in order: `Serial No.` · `Police Station` · `To,` `[Name of the
> Accused/Noticee]` · `[Last known Address]` · `[Phone No./ Email ID (if any)]` · recital
> "In pursuance of sub-section (3) of section 35 … during the investigation of
> FIR/Case No. ____ dated ____ u/s ____ registered at Police Station ____, it is revealed that
> there are reasonable grounds to question you …" · `appear before me at __ AM/PM on __ at __
> Police Station` · `Name and Designation of the Officer In charge` · `(Seal)`

This is a **free, high-value 9th document** CrimeGPT could add with 100 % fidelity — it is the
only one where the exact statutory wording is publicly prescribed. Recommend adding it.

The full list of the 58 forms is in **Appendix A** so that no builder ever cites a wrong
"Form No." — several forms in the CrPC Second Schedule were renumbered in the BNSS.

**Where the real chargesheet form comes from instead:** BNSS **s.193(3)(i)** says the report
shall be forwarded "**in the form as the State Government may, by rules provide**". So the
chargesheet proforma is a *State* form, and s.193(9) does the same for supplementary reports.
That delegation is the single most important structural fact for this project.

---

## 3. DOCUMENT-BY-DOCUMENT

### 3.1 `chargesheet` — Final Report / Charge-Sheet

**Governing provision:** BNSS **s.193(3)** (contents + State-prescribed form),
s.193(6)–(8) (accompaniments and copies), s.193(9) (further/supplementary report),
s.190 (forwarding accused when evidence sufficient), s.192 (case diary).

**Prescribed form number:**
* **Gujarat: Form C.P.C. 20** (charge-sheet). Final report is **Form C.P.C. 19**.
  Gujarat Police Manual Vol. III, **Rule 231(1)**: *"a charge-sheet in form C. P. C. 20, should
  be sent to the Magistrate direct."* Rule 232 covers final reports.
  Source (b): <https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf> (Rule 231 at
  manual p. 163–165; Rule 232 at p. 169). Ancestor text, identical wording, Bombay Police
  Manual Part III r.218: <https://www.mahapolice.gov.in/uploads/acts_rules/MumbaiPoliceManualPartIII.pdf>
* **National CCTNS template: NCRB I.I.F.-V "FINAL FORM/REPORT"** (also published as
  "FORM IF5"). Source (c): <https://police.py.gov.in/Police%20manual/Forms%20pdf/FORM-%20IF5.pdf>
  and <https://shillongpolice.gov.in/Police_Acts_Manual/07_Integrated_Investigation_Forms_NCRB_I.I.F._ITOVII.pdf>
* **BNSS-era State notification (structure to copy):** Government of Assam, Home (A)
  Department notification under **s.193(3)(i) BNSS** — "FINAL POLICE REPORT FORM
  (CHARGE SHEET / FINAL REPORT)". Source (b2):
  <https://homeandpolitical.assam.gov.in/sites/default/files/swf_utility_folder/departments/hp_assam_webcomindia_org_oid_3/menu/document/notification_under_section_193_of_bnss_2023.pdf>

**Confidence: HIGH** for the field list; **MEDIUM** for "this is *exactly* Gujarat's 2024+
form" — I could not find Gujarat's own post-BNSS notification online (see §4 Open gaps).

#### 3.1.a The Gujarat cover-sheet layout (Form C.P.C. 20) — verified against a real filed chargesheet

Confirmed from a genuine Gujarat chargesheet (Naroda Patiya, SIT Gandhinagar, Charge sheet
No. 98/09, Naroda P.S., Ahmedabad) published by CJP —
source (b): <https://cjp.org.in/wp-content/uploads/2017/05/NP%20SIT%20Charge%20sheets.CC%2098.09%202-4-2009.pdf>

Header block (in this order):
1. `CHARGE SHEET` (title)
2. `Police station ____   Dist ____`
3. `Charge sheet No ____   Date ____`
4. `Name, address & occupation of complainant / informer ____`
5. `First information report no. I C.R. No ____ / Date ____`

Then a **five-column landscape table** (column headings verbatim):

| 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| Name address of accused sent for trial in custody / on bail | Name address of accused **not** sent up for trial whether address and not addressed **including absconders (show absconder in red ink)** | Property (including weapons) found, with particulars of where, when, by & by whom found & whether forwarded to Magistrate | Name and address of witness | Charge or information: name of offence & circumstance connected with it, in concise detail & under what section of law charged |

Footer block:
* Numbered **notes** (see r.231(1)(iii) list below)
* `Forwarded to the Hon'ble [Court] at __ hours on __ [date]`
* `Sd/- [Name] [Rank/Designation] [Unit]`

**Mandatory Gujarat-specific rules the generator must honour (GPM Vol. III r.231):**
* r.231(1)(i) — the **correct home address of each accused, and the place, time and date of
  arrest together with the name of the arresting officer**, must appear in column 1 (or at the
  foot of the foil), on **both the foil sent to the Magistrate and the counterfoil retained at
  the police station**. (The Court copies the home address into the committal warrant; a jail
  will bounce a warrant that lacks it.)
* r.231(1)(i) — **eye-witnesses must be marked in red ink** before their names in column 4.
* r.231(1)(ii) — value of property stolen and recovered **shown in a prominent place**.
* r.231(1)(iii) — **notes at the bottom of the charge-sheet** on, as applicable:
  (a) whether the date of hearing has been fixed by the police or the Magistrate should fix it;
  (b) what arrangements are made for conducting the prosecution;
  (c) whether police will keep witnesses present or want summonses issued;
  (d) whether Government-servant witnesses should be summoned through their official superiors;
  (e) whether any accused sent up has made a confession before a Magistrate;
  (f) whether finger impressions have been taken and sent to the Finger Print Bureau;
  (g) whether additional witnesses will be produced;
  (h) which articles have been sent for chemical analysis;
  (i) **whether the police wish to oppose bail**.
* r.231(1)(iv) — full record of previous convictions; flag if not yet received.
* r.231(1)(v) — for a deaf-and-dumb accused, quote marks of identification on the charge-sheet.
* r.231(2) — absconders later arrested → **supplementary charge-sheet**.
* r.231(3) — the charge-sheet must be **accompanied by**: (i) the accused if in custody;
  (ii) the bail bond if on bail; (iii) **a descriptive roll and marks of identification of the
  accused**; (iv) weapons/articles of evidentiary value; (v) bonds of complainant and
  witnesses; (vi) **remand order, if any**; (vii) all documents relied on + s.180 (ex-161)
  statements, with the exclusion note where applicable.
* r.232(3) — for a **final report** (no chargesheet), the Magistrate must be requested to
  classify the case and issue a summary: **"A" true but undetected · "B" maliciously false ·
  "C" neither true nor false · "Non-cognizable"**. The current builder has no concept of this.

#### 3.1.b The BNSS-era numbered field list (Assam notification — copy this ordering)

`IN THE COURT OF ____`
1. Name of the PS · District · FIR No. · Year · Date
2. Final Report / Charge Sheet (tick) · No. · Date
3. (i)–(iii) Act / Sections; (iv) Other Acts & Sections
4. Type of Final Form/Report — Charge Sheeted / Not Charge Sheeted for want of evidence /
   FR Undetected / FR Untraced / FR offence abated / FR Un-occurred (tick)
5. If FR Un-occurred — False / Mistake of Fact / Mistake of Law / Non-cognizable / Civil Nature
6. If charge-sheeted — **Original / Supplementary** (tick)
7. Name of the I.O. · Rank (all IOs if more than one)
8. Complainant/informant: (a) Name (b) Father's/Husband's Name (c) Address (d) Contact No. &
   Email (e) Aadhaar / PAN / Voter ID / DL / other govt ID
9. **Properties/Articles/documents including electronic and digital records** recovered/seized —
   table: `Sl No. | Property description | Estimated value (Rs.) | P.S. Property Register No. |
   From whom / where recovered or seized | Disposal`
10. **Particulars of accused persons charge-sheeted** (separate sheet each, with **Photo** box):
    (i) Name + whether verified (ii) Father's Name (iii) Date/Year of birth (iv) Sex
    (v) Nationality (vi) Passport No. + date & place of issue (vii) Aadhaar/PAN/Voter ID/DL
    (viii) Contact Number (ix) Email (x) Religion (xi) SC/ST/OBC (xii) Occupation
    (xiii) Address *(with landmark of the locality)* + whether verified
    (xiv) Provisional Criminal No. (xv) Regular Criminal No. (xvi) **Date of Arrest**
    (xvii) Date of release on bail (xviii) Date on which forwarded to Court
    (xix) Under Acts & Sections (xx) Names/addresses of bailors/sureties
    (xxi) Previous convictions with case reference
    (xxii) **Status**: Not Arrested / Arrested (→ Bailed by Police / Bailed by Court / Judicial
    Custody) or Evading investigation / Proclaimed offender
11. **Particulars of accused persons NOT charge-sheeted** — same field set, plus
    "(xx) Any special remarks including reasons for not charge sheeting"
12. (i) **Witnesses cited/relied upon** — table: `Sl | Name | Father's/Husband's Name,
    Date/Year of Birth | Occupation | Permanent Address with Aadhaar No., Contact No., Email |
    Statement recorded or not; if yes, number of pages | Type of evidence to be tendered and
    serial numbers of documents to be marked by the witness`
    (ii) **Documents including electronic and digital records** — `Sl | Details of the document
    | Number of pages | Brief of contents | By whom the document will be marked during trial,
    serial numbers of witness`
    (iii) **Articles / electronic device / Material Objects** — `Sl | Description | Perishable or
    permanent | Location (FSL / with Expert / Malkhana / Deposited in court / Bank / Treasury /
    Other) | If disposed, details of court order`
    with the note: *"In case of electronic device, state the sequence of custody which may also
    include any electronic trail … or transaction trail … or any blockchain trail … If needed, a
    separate chain-of-custody form may be included."* ← this is the s.193(3)(i) implementation
13. If FIR is false, action taken/proposed **u/s 217 / 248 BNS**
14. Result of laboratory analysis / Expert Opinion / Medical Examination
15. Whether the report of medical examination of the woman has been attached where the
    investigation relates to **BNS ss. 64, 65, 66, 67, 68, 70 or 71** (Yes/No) — s.193(3)(h)
16. Whether **prosecution sanction**, if required, obtained; particulars
17. Brief facts of the case **+ a separate "Charge" block**
18. Notice served to complainant if Final Report (Yes/No, date)
19. Dispatched on
20. No. of enclosures
21. List of enclosures
Signature block, verbatim order: **`Forwarded by Officer-in-Charge` (left) | `Signature of the
Investigating Officer (Submitting the Final Report/Charge sheet)` — Name, Rank (right)**

*(The older CCTNS IF5 numbering is materially the same but adds "If supplementary or original",
"Refer Notice served Yes/No", and lacks the electronic-records and sanction items. Use the
BNSS-era ordering.)*

#### 3.1.c ⚠ Terminology caution — "Purvani"

The task brief calls the chargesheet "the *Purvani* chargesheet". **I could not find any source
supporting that usage, and the evidence points the other way**: in the real Gujarat chargesheet
above, the supplementary filings are repeatedly described as *"Supplymentry chargesheet"*, and
Gujarati **પુરવણી (puravani)** means *supplement / addendum*. So "Purvani chargesheet" most
likely means **supplementary chargesheet** (BNSS s.193(9); GPM r.231(2)) — a *different*
document from the original charge-sheet. **Confidence: LOW — do not put "Purvani" on the main
chargesheet title until a serving officer confirms.** If it does mean supplementary, CrimeGPT
should expose it as a separate mode (item 6 "Original / Supplementary" tick + only the new
material), which is also what s.193(9) requires.

#### 3.1.d DELTA — `_build_chargesheet` vs the real form

| Real form requires | Current builder |
|---|---|
| `IN THE COURT OF ____` line | **Absent** (only remand/custody letters have a court line) |
| Charge-sheet No. + date, separate from FIR No. | **Absent** — `_case_header` has only FIR/Crime No. |
| **Type of final report** (Charge-sheeted / Untraced / Undetected / Un-occurred / abated) and the un-occurred sub-classification | **Absent** — the builder can only ever produce a charge-sheet |
| **Original vs Supplementary** flag | **Absent** |
| A/B/C/Non-cognizable summary request (Gujarat r.232(3)) | **Absent** |
| IO name + rank as a *field* (item 7), all IOs | Only a signature line |
| Complainant father's/husband's name, address, contact, email, govt ID | Only a bare name string |
| Property table: `P.S. Property Register No.`, `From whom/where recovered`, `Disposal` | `_property_block` has `S.No / Description / Identifying marks / Qty / Est. value` — 3 of the 6 real columns are wrong or missing |
| ~22 per-accused fields incl. photo box, DOB, sex, nationality, passport, Aadhaar, religion, SC/ST/OBC, occupation, provisional & regular criminal number, date of release on bail, date forwarded to court, sureties, previous convictions, 6-way status enum | `_accused_block` has 6 fields (name, parentage, address, age/occupation, arrest date/time, custody-bail status) |
| **Separate "accused NOT charge-sheeted" section** with reasons | **Absent entirely** |
| Witness table with father's name, DOB, occupation, address+Aadhaar+contact, statement-recorded/pages, type of evidence | `_witness_block` has `S.No / Name & Address / Category` and **fabricates two blank "Eye-witness / Panch" rows** |
| Red-ink marking of eye-witnesses (r.231(1)(i)) | **Absent** |
| Documents-relied-upon table; Articles/MO table with location and chain-of-custody note | **Absent** — s.193(3)(i) is reduced to one free-text row "Chain of custody of electronic device" |
| Lab/expert/medical result; prosecution sanction; s.193(3)(h) women's medical-report flag | **Absent** |
| Bottom notes (a)–(i), incl. **"whether the police wish to oppose bail"** | **Absent** |
| Accompaniments list (bail bond, descriptive roll, weapons, bonds, remand order); no. + list of enclosures; dispatch date | **Absent** |
| Signature order: *Forwarded by Officer-in-Charge* + *Signature of IO submitting* | `_signoff` renders "Investigating Officer" then "Station House Officer (endorsement)" — right people, wrong captions/order |
| — | Builder **adds** a column `Old-code ref (cf.)` in `_sections_block`. **No real form has this.** Useful for the demo narrative; must not appear on a filing-shaped artefact. |

---

### 3.2 `remand_request` — forwarding for police custody, BNSS s.187

**Governing provision:** BNSS **s.187** (verbatim, from the India Code PDF): the officer in
charge / IO **not below the rank of sub-inspector** shall "forthwith transmit to the nearest
Magistrate a copy of the entries in the diary … and shall at the same time forward the accused
to such Magistrate." Related: s.58 (24-hour rule), s.192 (case diary), s.53 (mandatory medical
examination of every arrested person).

**Prescribed form: NOT FOUND — and I believe none exists.** The BNSS Second Schedule has no
remand form; s.187 prescribes no form; Gujarat Police Manual r.218 describes it as **"a report
giving reasons for further remand … supported by copies of the case diaries"** rather than a
prescribed proforma. **Class (a2) + (b). Confidence: HIGH on contents, NOT-FOUND on layout.**

Sources:
* BNSS s.187 — <https://www.indiacode.nic.in/bitstream/123456789/20099/1/A202346.pdf>
* Gujarat Police Manual Vol. III, **Rule 218 "Remand"** —
  <https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf>

**Content requirements established by source (safe to template):**
1. Addressed to the **nearest Judicial Magistrate** (JMFC, or JM 2nd class specially empowered
   by the High Court — s.187(5): a 2nd-class Magistrate not so empowered **cannot** authorise
   police custody).
2. Crime/FIR No., year, PS, district, Acts & sections.
3. Rank of the forwarding officer (**must be ≥ Sub-Inspector**) — s.187(1).
4. Date & time of **arrest**; date & time of **production**; demonstration that 24 hours under
   s.58 have not/­cannot be complied with.
5. Statement that **copies of the case-diary entries are transmitted herewith** — this is a
   statutory precondition, not an optional enclosure (s.187(1); GPM r.218(2) "supported by
   copies of the case diaries").
6. Custody sought: **police custody** vs **judicial custody**; number of days.
7. Cumulative custody arithmetic — s.187(2): detention "for a term not exceeding fifteen days
   in the whole, or **in parts, at any time during the initial forty days or sixty days** out of
   a detention period of sixty days or ninety days as the case may be"; s.187(3): outer limits
   **90 days** (death / life / ≥10 years) or **60 days** (other), after which default bail.
8. Specific, non-boilerplate grounds tied to case-diary entries (GPM r.218(2): the Magistrate
   grants police custody only "if he feels satisfied that there are reasonable grounds").
9. Confirmation the accused is **produced in person** — s.187(4) requires in-person production
   for police custody every time; judicial-custody extension may be by audio-video means.
10. Place of detention declaration — s.187(5) second proviso: no person shall be detained
    otherwise than in a police station under police custody or in prison under judicial custody.
11. Woman under eighteen → detention must be in a **remand home or recognised social
    institution** (s.187(5) first proviso).
12. Whether medical examination u/s 53 has been done (relevant to custodial-safety objections).

**DELTA — `_build_remand_request`:**
* Framed as an "APPLICATION … Under Section 187" with a prayer clause. Correct framing is a
  **forwarding report + transmission of case-diary entries**; keep the prayer, but the document
  must open by discharging the s.187(1) duty.
* `_center(d, "In the Court of the Judicial Magistrate First Class, Ahmedabad")` is hard-coded;
  s.187 says **nearest** Magistrate, and s.187(6) provides an Executive-Magistrate fallback
  (max 7 days) where no Magistrate is available. Neither is modelled.
* Missing: rank-of-officer ≥ SI declaration, 24-hour computation, in-person-production
  statement (s.187(4)), place-of-detention declaration, the 15-in-parts / 40–60-day window,
  woman-under-18 proviso, s.53 medical examination status.
* `grounds = list(facts.events) + ["Recovery of case property and discovery of facts.",
  "Identification and confrontation of co-accused."]` — appending two fixed sentences to every
  application produces exactly the boilerplate that GPM r.218(2) and the case law say
  Magistrates should reject. These must be officer-authored or omitted.
* Enclosures paragraph says the case diary is "produced/enclosed" as prose; it should be a
  checkable enclosure list with page counts.

---

### 3.3 `seizure_receipt` — seizure memo / property search & seizure

**Governing provisions (verified verbatim against the Act):**
* **s.103(4)–(7)** — before a search, call **two or more independent and respectable
  inhabitants of the locality**; search made in their presence; **"a list of all things seized …
  and of the places in which they are respectively found shall be prepared … and signed by such
  witnesses"**; the occupant may attend and **a copy of the signed list shall be delivered to
  the occupant**; where a *person* is searched, a separate list, copy delivered to that person.
* **s.105** — the whole process, "including preparation of the list of all things seized … and
  signing of such list by witnesses, **shall be recorded through any audio-video electronic
  means preferably mobile phone**" and the recording forwarded **without delay** to the
  District Magistrate / Sub-divisional Magistrate / JMFC.
* **s.106(1)–(3)** — a police officer may seize property alleged/suspected stolen or found in
  suspicious circumstances; a subordinate must **forthwith report the seizure to the SHO**; and
  every officer shall **forthwith report the seizure to the Magistrate having jurisdiction**,
  and may give custody on a bond to produce.
* **s.107** — attachment/forfeiture of proceeds of crime requires **approval of the SP/CP** and
  an **application to the Court** — *not* something a seizure memo can do.
* **BSA s.63** — certificate for electronic records (already covered in
  `research/bsa-63-certificate-format.md` in this repo).

**Prescribed form:** **NCRB I.I.F.-IV "PROPERTY SEARCH & SEIZURE FORM"** — class (c),
national CCTNS form, still the de-facto proforma; the printed sub-caption cites CrPC
51/102/165, which maps to **BNSS 100/106/185**. Gujarat additionally regulates the
*panchnama* and the *muddamal* handling (below).
Sources:
* IIF-IV full text — <https://shillongpolice.gov.in/Police_Acts_Manual/07_Integrated_Investigation_Forms_NCRB_I.I.F._ITOVII.pdf>
* GPM Vol. III **r.169** (identity of articles), **r.178** (Muddamal Register, Form P.M. 81;
  'Pavtis'/'Yadis' in duplicate for court production), **r.180** (panchnama) —
  <https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf>

**Confidence: HIGH** (field list is verbatim from an official police-manual PDF); **MEDIUM**
that Gujarat uses IIF-IV rather than a locally-printed muddamal-panchnama form.

**IIF-IV field list, verbatim in order:**
1. District · P.S. · Year · FIR/G.D. No. · Date
2. Acts and Sections
3. **Nature of property seized: Stolen / Unclaimed / Unlawful possession / Involved / Intestate**
4. Property seized/recovered: (a) Date (b) Time (c) Place (d) **Description of the place**
5. Person from whom seized/recovered: Name · Father's/Husband's name · Sex · Age · Occupation ·
   Address · **Professional receiver of stolen property Yes/No**
6. **Witnesses (i) and (ii)**: Name · Father's/Husband's name · Age · Occupation · Address
7. Action taken/recommended for disposal of **perishable** property
8. Action taken/recommended for keeping of **valuable** property
9. **Identification required: Yes/No**
10. Details of properties seized/recovered (*use appropriate prescribed annexure form(s) and
    attach* — annexures exist for e.g. counterfeit currency, narcotic drugs)
11. **Circumstances/grounds for seizure**
12. Declaration: seized in accordance with law in the presence of the said witnesses **and a
    copy of the seizure form was given to the person / occupant** (with a footnote to strike
    this out where no receipt is required)
13. Table of what was **packed and/or sealed**: `Sl. No. | Property | Indicate whether signature
    obtained on the packet or on the body of the property`
Signature block: `Signature of the person from whom seized (if present)` · `Witness-1
Signature` · `Witness-2 Signature` · **`Specimen of the seal is given below`** box ·
`Signature of Investigating Officer` — Name, Rank, No., Place, Date.

**Gujarat overlay (GPM r.169) — must be reflected:** articles described in the panchnama are
**serially numbered**, separate serial ranges per panchnama; **large distinctive labels** with
the article name/number, the person it was seized from and the date, securely fastened;
receptacles with small valuables **sealed as well as labelled**; the panchnama serial numbers
must be quoted in the forwarding report to the medical officer/FSL, with the **number of seals**
stated in the body of the report and a **receipt with seals intact** obtained back.

**DELTA — `_build_seizure_receipt`:**
* Title/citation says "SEIZURE MEMO / PANCHNAMA … Sections 103, 105 & 106". Those are three
  different situations (search of a closed place / audio-video recording duty / seizure of
  suspected stolen property). The builder should pick the operative one per scenario; listing
  all three on the face of the memo is the kind of thing a judge notices.
* Missing: `Nature of property (5-way enum)`, `Description of the place`, `Professional
  receiver Yes/No`, `Circumstances/grounds for seizure`, `perishable-property action`,
  `valuable-property action`, `Identification required Yes/No`, the **packed/sealed table with
  "signature on packet or on body of property"**, and the **specimen-of-seal box**.
* Missing the s.103(6)/(7) **copy-delivered acknowledgment** as a distinct endorsement (the
  builder has "Signature of person from whom seized (acknowledgement)" but no statement that a
  copy of the list was delivered, which is the statutory act).
* Missing the s.106(3) **forthwith report of seizure to the Magistrate** (and s.106(2) report to
  the SHO where the seizing officer is subordinate).
* Property table has `Make/Model`, `IMEI/Serial`, `Distinguishing marks` — good and worth
  keeping — but lacks `P.S. Property Register No.` (the muddamal register entry, GPM r.178) and
  `Disposal`.
* The SHA-256 block is a genuine CrimeGPT value-add, but it is presented as if the memo itself
  must carry the hash ("absence of the hash may render the electronic evidence inadmissible").
  That overstates the law: the hash requirement lives in the **BSA s.63 certificate**. Reword to
  reference the s.63 certificate annexure rather than asserting a memo-level rule.
* The s.105 recording paragraph is correct in substance; it should also capture *where the
  recording was forwarded* (DM / SDM / JMFC) and when, since that is the auditable fact.

---

### 3.4 `court_custody_letter`

**Prescribed form: NOT FOUND (class d).**

Findings:
* There is **no BNSS Second Schedule form** for pre-trial judicial custody. Forms 16, 17, 35,
  39–41, 53, 56, 58 are all commitment warrants for *other* situations (security, sentence,
  contempt, surety, fine).
* Judicial custody during investigation is **authorised by the Magistrate under s.187(2)**, on
  the same forwarding report as police custody. The police-side document is therefore the
  **same instrument as §3.2** with the custody type set to judicial.
* The instrument that actually travels to the jail is a **court-issued custody warrant**. The
  only publicly available specimen I found is **Bihar** (Patna High Court / BSLSA) — useful as a
  structural reference only, **not** a Gujarat form:
  <https://patnahighcourt.gov.in/bslsa/PDF/UPLOADED/22.PDF> — fields: `Jail No.` · Name ·
  Father's Name · Age · Gender · Address · Nationality · **Photo of inmate** · FIR No. ·
  u/s (as per FIR) · Arrested u/s · Police Station · District · Date of Arrest · advocate
  (Pvt/Legal Aid) · then serial tables `Date | Remand Order by Ld. Judge / Next date` for each
  stage (during investigation, after chargesheet, during prosecution evidence, during statement
  of accused, during defence evidence) · Date of filing of charge sheet · Date of committal ·
  Date of framing of charge.
* Gujarat-side, GPM Vol. III r.231(1)(i) confirms the **committal warrant** is filled by the
  Court from the charge-sheet's home-address column — i.e. the warrant is a court product.

**DELTA — `_build_court_custody_letter`:**
* `_DOC_META` cites *"Under Section 190 r/w Section 187"*. **s.190 is wrong for this purpose** —
  it is "Cases to be sent to Magistrate, when evidence is sufficient", i.e. the end-of-
  investigation forwarding that accompanies the charge-sheet (and it carries its own duties:
  s.190(2) requires sending along **any weapon or other article** to be produced, and requiring
  the complainant and witnesses to **execute bonds** — BNSS **Form No. 30, "Bond to prosecute or
  give evidence (See section 190)"**). Recommend: cite **s.187(2)** for judicial custody, and
  keep s.190 only for the charge-sheet-stage forwarding, where Form No. 30 should be generated
  as a companion document.
* The builder currently reuses `facts.events` as "grounds" for judicial custody. Judicial
  custody generally does **not** require investigative grounds in the way police custody does —
  it requires the s.187(1) forwarding + case diary. Reusing PC grounds here is a visible
  category error.
* Missing everything the jail/court side actually needs: date & time of arrest, current
  cumulative custody, next production date, whether the accused is a woman/juvenile, medical
  examination status (s.53), and the enclosure of the arrest memo.

---

### 3.5 `accused_panchanama` — arrest panchnama / arrest memo

Two *different* real documents are conflated here, and both are prescribed.

**(A) The panchnama itself — Gujarat, class (b), confidence HIGH.**
Gujarat Police Manual Vol. III, **Section IV, Rule 180** —
<https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf>

Rule 180(4) fixes the *structure* (verbatim): the panchnama **"should begin with a mention of
the full names, age, occupation and address of the panch, followed by a preamble explaining the
purpose … It should contain full and accurate statements of the articles or other relevant
circumstance found and the exact spots at which they were attached. After it has been written
up, it should be read over by or to the panch and they should be asked to sign it … The name of
the writer should be mentioned and his signature taken. The time when it was commenced and
completed, the date and the place should also be mentioned in it."**

So the canonical Gujarat panchnama skeleton is:
1. Panch particulars — full name, **age**, occupation, address (of each of two panchas)
2. Preamble — purpose of the proceeding (arrest / personal search / discovery / scene)
3. Narrative body — what the panchas observed, in sequence, with **exact spots**; articles
   **serially numbered** (r.169(1)); currency-note numbers recorded and initialled by panchas
   (r.180(5)(v)); goldsmith weighing for ornaments (r.180(5)(vii)); where property is produced
   by the accused, the exact place and the fact that the panchas accompanied him (r.180(5)(viii))
4. **Time commenced** and **time completed**, date, place
5. Read-over endorsement + panch signatures
6. **Name and signature of the writer**
7. Endorsement that a **copy was given to the person concerned without his asking** (r.180(5)(iii))
8. Erasures/insertions initialled by at least two panchas (r.180(5)(iii))

Rule 180(2) also fixes **who may be a panch**: mature, intelligent, literate as far as possible,
respectable, independent, unbiased, free from objectionable antecedents, **not connected with
the police**, selected by the police officer and **not by the complainant**; **female panch where
females are concerned**; panchas from outside the locality permitted if independent locals are
unavailable. Rule 180(3): panchas present from beginning to end. Rule 180(5)(ix)(a): **do not
include statements of the accused** except to the extent admissible under (now) BSA s.23 /
old s.27, and only if made in the presence of the panchas.

**(B) The arrest memo — NCRB I.I.F.-III "ARREST / COURT SURRENDER FORM"**, class (c),
separate form for each accused. Confidence HIGH (verbatim from an official PDF).
Source: <https://shillongpolice.gov.in/Police_Acts_Manual/07_Integrated_Investigation_Forms_NCRB_I.I.F._ITOVII.pdf>
(also <https://police.py.gov.in/Police%20manual/Forms%20pdf/FORM%20IF%203.pdf>)

Field list, verbatim in order:
1. District · P.S. · Year · FIR/Proceeding/G.D. No. · Date · **Alphanumeric code of the accused
   (A1–A9 for the first nine persons, B1 for the tenth, and so on)**
2. Date, Time and **G.D. No.** of arrest/surrender; Place of arrest (P.S., District)
3. Name of the court (if surrendered)
4. Acts and Sections
5. Tick one: Arrested and forwarded / Arrested and released on bail or PR bond / Arrested but
   released on anticipatory bail / **Arrested and remanded to police custody** / Surrendered in
   court and bailed out / Surrendered in court and sent to judicial custody / Surrendered in
   court and remanded to police custody
6. Particulars of the arrested person: (i) Name (ii) Father's/Husband's Name (iii) First Alias
   (iv) Second Alias (v) Nationality (vi) Voter ID / Passport No. + date & place of issue
   (vii) Religion (viii) Caste/Tribe (ix) SC/ST/OBC (x) Occupation (xi) Permanent Address +
   Distt + P.S. (xii) Present Address + Distt + P.S.
7. **Injuries, cause of injuries and physical condition of the arrested person (indicate if
   medically examined)** — this is the BNSS s.53 hook
8. Narrative block: *"The arrested person, after being informed of the **grounds of arrest and
   his legal rights**, was duly taken into custody on __ (date) at __ (hours) at __ (place). The
   following article(s) was/were found on **physical search** … and was/were taken into
   possession, for which **a receipt was given to the arrested person**. If no article found,
   'NIL' may be indicated."* + *"Necessary wearing apparels were left on the arrested person for
   the sake of human dignity and body protection. The arrested person was cautioned to keep
   himself/herself covered for purpose of identification."* +
   **"Intimation given to Shri/Smt. ____ (relation of) ____ on (date) ____ at (hrs.) ____"**
9. **Physical features / descriptive roll table:** `Sex | Date/Year of Birth | Build | Height
   (cms.) | Complexion | Identification Mark(s)` and a second table `Deformities/peculiarities |
   Teeth | Hair | Eyes | Habit(s) | Dress Habit(s) | Language/Dialect | PLACE OF: Burn mark,
   Leucoderma, Mole, Scar, Tattoo` + "Other features, if any"
10. Whether finger-prints taken: Yes/No
11. Socio-economic profile: living status; educational qualification; occupation; income group
12. Risk assessment (Yes/No each): is dangerous · previously jumped bail · generally armed ·
    operates with accomplices · known/listed criminal · recidivist · likely to jump bail · if
    released on bail likely to commit crime or threaten victims/witnesses · wanted in any other
    case
13. **Name and address of the witnesses (at least one witness is necessary)** + signatures
14. **Signature or LTI of arrested person** · Signature of Investigating Officer (Name, Rank,
    No.) · Place · Date

Statutory overlay that must appear: BNSS **s.47** (grounds of arrest to be communicated),
**s.48** (information of arrest to a relative/friend), **s.37** (designated police officer and
display of arrest information), **s.53** (mandatory medical examination of every arrested
person, female by/under supervision of a female medical officer), **s.51/52** where examination
for evidence is sought.

**DELTA — `_build_accused_panchanama`:**
* **Wrong genre.** Output is `_kv` tables + boilerplate paragraphs. Gujarat panchnama = narrative
  under r.180(4). This is the single most visible structural error after the chargesheet.
* Panch witnesses are a bare `Name, Parentage & Address | Signature` table at the **end**. In a
  real panchnama the panch particulars (incl. **age** and **occupation**) come **first**, before
  the preamble.
* Missing: time **commenced** and time **completed** (r.180(4) requires both — the builder has
  neither), place/date of writing, **name and signature of the writer**, read-over endorsement,
  copy-given endorsement, erasure-initialling note.
* Missing the entire IIF-III field set: alphanumeric accused code, G.D. No., 7-way arrest-status
  tick, aliases, permanent vs present address, injuries/medical-examination status, **grounds of
  arrest communicated**, **receipt for articles found on personal search**, wearing-apparel /
  human-dignity clause, **intimation to relative with name, relation, date and hour** (s.48),
  descriptive-roll tables, fingerprints taken, socio-economic profile, risk assessment.
* `_signoff` gives only "Arresting Officer". The real form requires **Signature or LTI of the
  arrested person** and at least one attesting witness — omitting the arrestee's signature is
  the classic ground for challenging an arrest memo.

---

### 3.6 `medical_treatment_letter` — MLC requisition

**Governing provisions (verbatim from the Act):**
* **s.51** — examination of an **accused** (person *arrested*) by a registered medical
  practitioner **at the request of any police officer**; s.51(2) female examined only by/under
  supervision of a **female** RMP; **s.51(3) the RMP shall without delay forward the report to
  the IO**. "Examination" expressly includes blood, blood stains, semen, swabs in sexual
  offences, sputum, sweat, hair samples, finger-nail clippings, **DNA profiling**.
* **s.52** — examination of a person arrested for **rape / attempt**, by a Government or local
  authority hospital RMP (or any RMP if none within 16 km); the report must state (i) name and
  address of the accused and of the person who brought him, (ii) age, (iii) marks of injury,
  (iv) description of material taken for **DNA profiling**, (v) other material particulars;
  reasons for each conclusion; **exact time of commencement and completion**; report forwarded
  to the IO who forwards it to the Magistrate under s.193(6)(a).
* **s.53** — **every arrested person** shall be examined by a Government medical officer soon
  after arrest (or an RMP if unavailable); female by/under supervision of a female medical
  officer; record must mention **injuries or marks of violence and the approximate time when
  inflicted**; a **copy of the report is furnished to the arrested person or his nominee**.
* For a **rape victim**, the operative provision is **BNSS s.184** (not s.51).

**Prescribed form for the police requisition:** class (c), confidence **MEDIUM-HIGH** for the
field list, **LOW** that Gujarat's own printed "yadi" matches it exactly.
Puducherry Police Manual, Chapter XLIII (Medico-legal) prints an actual **PROFORMA** —
<https://police.py.gov.in/Police%20manual/Chapter%20PDF/CHAPTER%2043%20General%20Guidelines%20relating%20to%20Medico-legal,%20Narcotic,%20Gambling.pdf>

Layout, verbatim:
```
Cr. No.                                   Police Station
Section of Law                            Circle
                                          Dated:
To
     The Casualty Medical Officer
     Government General Hospital / ____
Sir,
     I am sending an injured person (whose particulars are furnished below),
     concerned in Cr. No. ____ u/s ____ of (Acts) of Police Station ____, ____ Circle,
     ____ Region, requesting you to medically examine him/her and to issue a wound
     certificate / medico-legal examination report, to proceed further in the matter.
     The medical officer is also requested to notify in the certificate/report, the
     detailed description of the AGE and TYPE of injuries and the TYPE OF WEAPON used
     in the commission of the offence.
                        PARTICULARS OF THE INJURED
 (1) NAME OF THE INJURED (in capital letters, with alias if any)
 (2) FATHER'S NAME
 (3) AGE
 (4) SEX
 (5) ADDRESS OF THE INJURED
     The above injured person is sent through PC/HC (Number & Name) ____ of Police
     Station ____ from Police Station ____ at ____ (hours) on ____ (date).
                        BRIEF FACTS OF THE CASE
                                          STATION HOUSE OFFICER
                                          P.S. ____        DATE
```
Rules attached to it: **one forwarding note per injured person**; the officer must **specify the
injuries as visually observed**; and must make a **special request to issue the certificate
forthwith**. The requisition must come from an officer of the rank of **Sub-Inspector or above**.

The corresponding hospital-side documents (what the police will get back) are prescribed in the
**Kerala Medico-Legal Code, Annexure 1** — Accident Register-cum-Wound Certificate (14 numbered
fields, in triplicate ORIGINAL/DUPLICATE/TRIPLICATE), Police Intimation, Certificate of
Drunkenness (which explicitly records "Whether under arrest or not (**to be specified in
requisition**)" and "Date & time of arrest (**as specified in the requisition**)"):
<https://dhs.kerala.gov.in/wp-content/uploads/2020/04/annexure1.pdf> ·
<https://dhs.kerala.gov.in/wp-content/uploads/2020/04/code.pdf>
→ These tell us two fields the requisition **must** carry that the current builder omits:
**whether the person is under arrest**, and **the date & time of arrest**.

Gujarat overlay: GPM Vol. III **r.142** (medico-legal cases to Government medical officers in
preference to private practitioners; not to compounder-run dispensaries), **r.143** (medical
officers to supply injury certificates immediately after examination), **r.144(2)** (for a
post-mortem the police must send a **written authority** stating the medico-legal aspects and
the points needing special attention).

**DELTA — `_build_medical_treatment_letter`:**
* **Wrong section for the default subject.** `_DOC_META` cites **s.51** (accused), but the
  builder picks `facts.victims[0] if facts.victims else facts.accused[0]`. A victim requisition
  is not a s.51 request. Needs a `subject_type` switch driving the citation:
  victim/injured → MLC requisition (GPM r.142–143) · rape victim → **s.184** ·
  arrested person → **s.53** (mandatory) · accused for evidence → **s.51** ·
  accused of rape → **s.52**.
* Missing header fields: `Cr. No.`, `Section of Law`, `Police Station`, `Circle`, `Dated` as a
  proper form header (the generic `_case_header` puts FIR No. in a table instead).
* Missing: **escort details** ("sent through PC/HC number & name … at __ hours on __ date"),
  **brief facts of the case**, the explicit request to state **age and type of injuries and type
  of weapon**, the request for issuance **forthwith**, "whether under arrest" + "date & time of
  arrest", consent, and the s.51(2)/s.53 proviso that a **female must be examined by or under
  the supervision of a female** RMP / medical officer.
* Missing the s.51(3)/s.52(5) instruction that the RMP must **forward the report to the IO
  without delay** — worth printing on the requisition, since it is the hospital's statutory duty.
* "REQUISITION FOR MEDICAL EXAMINATION / TREATMENT" as a single title conflates *treatment*
  (a hospital act) with *examination for evidence* (a statutory act). Real requisitions name one.

---

### 3.7 `face_identification_form`

**Prescribed form: NOT FOUND (class d) — and the current design is legally unsound.**

What the law actually says:
* **BNSS s.54, "Identification of person arrested"** (verbatim): *"Where a person is arrested on
  a charge of committing an offence and his identification by any other person or persons is
  considered necessary for the purpose of investigation of such offence, **the Court, having
  jurisdiction may, on the request of the officer in charge of a police station, direct** the
  person so arrested to subject himself to identification by any person or persons **in such
  manner as the Court may deem fit**"* — with a proviso that where the identifying person is
  mentally or physically disabled the process takes place **under the supervision of a
  Magistrate** and **shall be recorded by audio-video electronic means**.
  → The police-side document is therefore a **request/application to the Court**, not a form the
  IO fills in and signs off himself.
* **Gujarat Police Manual Vol. III, Rule 181 "Holding of Identification Parade"** (class (b),
  confidence HIGH) — <https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf>:
  * *"Identification Parades held in the presence of the Police are inadmissible in the
    Courts."* Police must obtain the help of an **Executive Magistrate**; if none is available,
    the only alternative is to hold the parade **by the panch witnesses**.
  * Statements made before police officers at a TIP are hit by (then) s.162 CrPC → now
    **BNSS s.181**.
  * Mixing ratio: **1 suspect to 9 others**, **+5 persons for every additional suspect**; not
    more than two suspects per parade.
  * Police must "completely obliterate themselves" after arranging the parade; witnesses kept
    at a distance and **called one by one**; identified witnesses must not re-mix with waiting
    witnesses; accused's objection to any person's presence considered; deformities/special
    marks made uniform; hospital parades have a specific procedure (cot-change option, number
    of patients and cot numbers recorded **in the panchnama**).
  * TIP must be held **early, before the accused gets bail**; piecemeal parades deprecated.

**What the real, prescribed "physical description" document is:** the **descriptive roll and
marks of identification of the accused**, which GPM r.231(3)(iii) makes a **mandatory
charge-sheet accompaniment**. Its prescribed field set is **IIF-III item 9** (reproduced in
§3.5 above): Sex · Date/Year of Birth · Build · Height (cms.) · Complexion · Identification
Mark(s) · Deformities/peculiarities · Teeth · Hair · Eyes · Habit(s) · Dress Habit(s) ·
Language/Dialect · **PLACE OF: Burn mark / Leucoderma / Mole / Scar / Tattoo** · Other features.
Related: r.231(1)(v) requires marks of identification on the charge-sheet for a deaf-and-dumb
accused, so the Court can send them with the warrant of commitment.

**DELTA — `_build_face_identification_form`:** the current form has
`Name/Alias · Approximate age · Height/Build · Complexion · Identifying marks · Last seen
location`, a `[ Affix / attach accused photograph ]` placeholder, an "Identified By (witness)"
table with a signature column, and an IO signature. Problems, in order of severity:
1. It is a **police-conducted photo identification signed by the IO** — the exact artefact GPM
   r.181(1)(b) says is inadmissible, and it bypasses the **Court direction** that s.54 requires.
2. `_DOC_META` cites *"Investigation aid — BNS / BNSS proceedings"*, i.e. no provision at all.
   The honest citation is **s.54 BNSS** (for a TIP request) or **none** (for a descriptive roll).
3. The description fields are a 6-item subset of a 15+ item prescribed descriptive roll.
4. No mention of the audio-video recording requirement in the s.54 proviso.

**Recommended re-scope (two documents, both defensible):**
* **(i) Application to the Court under s.54 BNSS** for a direction to hold a test identification
  parade — signed by the **officer in charge of the police station** (s.54 says "on the request
  of the officer in charge"), reciting FIR/sections, the arrest, why identification is necessary,
  the witnesses who claim they can identify, and a request that the parade be held before an
  Executive Magistrate; with the s.54 proviso branch where the identifying person is disabled.
* **(ii) Descriptive roll / marks of identification** using the IIF-III item 9 field set, marked
  as a charge-sheet accompaniment under GPM r.231(3)(iii).

---

### 3.8 `lers_request` — data request to Meta / WhatsApp

**Governing provision:** **BNSS s.94(1)** (verbatim): where any Court or **any officer in charge
of a police station** considers the production of *"any document, **electronic communication,
including communication devices, which is likely to contain digital evidence** or other thing"*
necessary or desirable, *"such Court may issue a **summons** or such officer may, by a **written
order**, either in physical form or in electronic form, require the person in whose possession
or power such document or thing is believed to be, to attend and produce it, or to produce it,
at the time and place stated"*. s.94(3) carves out BSA ss.129–130, the Bankers' Books Evidence
Act, and postal items.
→ **The police instrument is an ORDER, not a summons, and it must be issued by the officer in
charge of the police station.**

**Indian obligation on the platform:** IT (Intermediary Guidelines and Digital Media Ethics
Code) Rules, 2021, **Rule 3(1)(j)** — an intermediary shall provide information under its
control or possession, or assistance, to an authorised government agency **within 72 hours** of
receipt of an order, for investigation/detection/prosecution/prevention of offences, and the
order **"shall state clearly the purpose and reason for seeking such assistance or
information."** Source: <https://indiankanoon.org/doc/125230782/>

**Platform-side requirements — class (c), confidence HIGH (Meta's own published guidelines):**
<https://www.meta.com/safety/communities/law/guidelines/> · portal <https://www.facebook.com/records>
· WhatsApp portal <https://www.whatsapp.com/records/login> · WhatsApp FAQ
<https://faq.whatsapp.com/444002211197967> *(the WhatsApp FAQ page would not render for
automated fetch — treat its specifics as unverified)*

* **Accepted account identifiers:** *"the email address, phone number (+XXXXXXXXXX), user ID
  number or username"*. A profile URL alone is **not** on Meta's list. For WhatsApp the
  identifier is the **phone number in full international format**.
* **Requester details required:** *"the name of the issuing authority and agent, email address
  from a law-enforcement domain and direct contact phone number."* Personal-domain email is
  rejected.
* **Particularity:** requests must identify records *"with particularity, including the specific
  data categories requested and date limitations for the request"*; Meta *"will not process
  overly broad or vague requests."*
* **Preservation:** Meta preserves records for **90 days pending receipt of formal legal
  process**; preservation requests may be submitted through the online system.
* **Emergency:** for *"imminent harm to a child or risk of death or serious physical injury"*,
  submitted through the same system.
* **Non-US requests / content:** *"A Mutual Legal Assistance Treaty request or letter rogatory
  may be required to compel the disclosure of the **contents** of an account."* Non-content
  records tiers in Meta's guidelines are framed on US process (subpoena → 18 USC 2703(d) order
  → search warrant) and do not map onto BNSS s.94.

**DELTA — `_build_lers_request`:** this builder is structurally the closest to correct. Fixes:
* Re-style the document as a **"WRITTEN ORDER UNDER SECTION 94(1) BNSS, 2023"** issued by the
  **officer in charge of the police station**, addressed to the platform — not a generic
  "request". The `_DOC_META` line ("Under Section 94 BNSS … r/w the IT Act, 2000 and platform
  LERS policy") should add **IT Rules 2021 r.3(1)(j)** and drop the vague "platform LERS policy"
  as a source of legal authority.
* Add the r.3(1)(j) **"purpose and reason"** paragraph explicitly — it is a stated requirement of
  the Rule and is what makes the 72-hour clock enforceable.
* The identifier block lists `Username / Profile URL`; replace/augment with Meta's accepted set
  (email, phone `+XXXXXXXXXX`, user ID number, username) and note that a URL alone may be
  rejected.
* Add: LERS request reference/ID field; **90-day preservation window** stated on the face of the
  preservation request; explicit **date/time range with time zone** (the field exists, good —
  make it mandatory, since Meta rejects vague requests).
* Section 6 mixes preservation and emergency into one tick-box paragraph. Meta treats these as
  distinct workflows — split them.
* Section 5 item 4 says content is available *"only where accompanied by appropriate judicial
  process"*. For a non-US requester the accurate statement is **MLAT request or letter
  rogatory**; say that.
* `_title_block` prints the Gujarat/Ahmedabad masthead; for a platform-facing order that is
  fine and even helpful, but the officer's **government-domain email** must be prominent since
  it is the gating requirement.

---

## 4. OPEN GAPS — what still needs an RTI / a serving officer

1. **Gujarat's own notification under BNSS s.193(3)(i)** prescribing the post-July-2024 Final
   Police Report Form. I found Assam's; I could not find Gujarat's online. Until then the
   chargesheet must be built from GPM r.231 (Form C.P.C. 20) + the national CCTNS ordering, and
   labelled as such. *(RTI target: Home Department, Government of Gujarat / DGP Gujarat.)*
2. **A blank printed Gujarat Form C.P.C. 20 / C.P.C. 19** (foil + counterfoil). Rule 231 names
   the form; the form itself is not published. The real filed chargesheet in §3.1.a gives the
   column headings, which is most of it.
3. **The Gujarati-language column headings** for all of the above. Every real Ahmedabad filing
   is in Gujarati; English headings will read as a translation.
4. **Whether Gujarat uses NCRB IIF-III/IIF-IV** as printed, or a locally printed
   muddamal-panchnama book.
5. **WhatsApp's law-enforcement FAQ specifics** — the page would not render for automated
   fetch; the Meta guidelines above cover the group-level requirements.
6. **"Purvani"** — see §3.1.c. Needs a one-line confirmation from an officer.

---

## Appendix A — the complete BNSS Second Schedule (58 forms)

Source: <https://www.indiacode.nic.in/bitstream/123456789/20099/1/A202346.pdf>, "THE SECOND
SCHEDULE (See section 522)". Provided so no builder cites a non-existent or renumbered form.

| No. | Title | Section |
|---|---|---|
| 1 | Notice for appearance by the police | 35(3) |
| 2 | Summons to an accused person | 63 |
| 3 | Warrant of arrest | 72 |
| 4 | Bond and bail-bond after arrest under a warrant | 83 |
| 5 | Proclamation requiring the appearance of a person accused | (84) |
| 6 | Proclamation requiring the attendance of a witness | 84, 90, 93 |
| 7 | Order of attachment to compel the attendance of a witness | 85 |
| 8 | Order of attachment to compel the appearance of a person accused | — |
| 9 | Order authorising an attachment by the District Magistrate or Collector | 85 |
| 10 | Warrant in the first instance to bring up a witness | 90 |
| 11 | Warrant to search after information of a particular offence | 96 |
| 12 | Warrant to search suspected place of deposit | 97 |
| 13 | Bond to keep the peace | 125, 126 |
| 14 | Bond for good behaviour | — |
| 15 | Summons on information of a probable breach of the peace | 132 |
| 16 | Warrant of commitment on failure to find security to keep the peace | 141 |
| 17 | Warrant of commitment on failure to find security for good behaviour | 141 |
| 18 | Warrant to discharge a person imprisoned on failure to give security | 141, 142 |
| 19 | Warrant of imprisonment on failure to pay maintenance | 144 |
| 20 | Warrant to enforce the payment of maintenance by attachment and sale | 144 |
| 21 | Order for the removal of nuisances | 152 |
| 22 | Magistrate's notice and peremptory order | 160 |
| 23 | Injunction to provide against imminent danger pending inquiry | 161 |
| 24 | Magistrate's order prohibiting the repetition, etc., of a nuisance | 162 |
| 25 | Magistrate's order to prevent obstruction, riot, etc. | 163 |
| 26 | Magistrate's order declaring party entitled to retain possession of land, etc., in dispute | 164 |
| 27 | Warrant of attachment in the case of a dispute as to the possession of land, etc. | — |
| 28 | Magistrate's order prohibiting the doing of anything on land or water | 166 |
| 29 | Bond and bail-bond on a preliminary inquiry before a police officer | 189 |
| 30 | Bond to prosecute or give evidence | 190 |
| 31 | Special summons to a person accused of a petty offence | 229 |
| 32 | Notice of commitment by Magistrate to Public Prosecutor | 232 |
| 33 | Charges | 234, 235, 236 |
| 34 | Summons to witness | 63, 267 |
| 35 | Warrant of commitment on a sentence of imprisonment or fine if passed by a Court | — |
| 36 | Warrant of imprisonment on failure to pay compensation | 273 |
| 37 | Order requiring production in Court of person in prison for answering to charge of offence | — |
| 38 | Order requiring production in Court of person in prison for giving evidence | 302 |
| 39 | Warrant of commitment in certain cases of contempt when a fine is imposed | 384 |
| 40 | Magistrate's or Judge's warrant of commitment of witness refusing to answer or to produce document | — |
| 41 | Warrant of commitment under sentence of death | 407 |
| 42 | Warrant after a commutation of a sentence | 427, 453, 456 |
| 43 | Warrant of execution of a sentence of death | 453, 454 |
| 44 | Warrant to levy a fine by attachment and sale | 461 |
| 45 | Warrant for recovery of fine | 461 |
| 46 | Bond for appearance of offender released pending realisation of fine | 464(1)(b) |
| 47 | Bond and bail-bond for attendance before officer in charge of police station or Court | 478, 479, 480, 481, 482(3), 485 |
| 48 | Warrant to discharge a person imprisoned on failure to give security | 487 |
| 49 | Warrant of attachment to enforce a bond | 491 |
| 50 | Notice to surety on breach of a bond | 491 |
| 51 | Notice to surety of forfeiture of bond for good behaviour | 491 |
| 52 | Warrant of attachment against a surety | 491 |
| 53 | Warrant of commitment of the surety of an accused person admitted to bail | 491 |
| 54 | Notice to the principal of forfeiture of bond to keep the peace | 491 |
| 55 | Warrant to attach the property of the principal on breach of a bond to keep the peace | 491 |
| 56 | Warrant of imprisonment on breach of a bond to keep the peace | 491 |
| 57 | Warrant of attachment and sale on forfeiture of bond for good behaviour | 491 |
| 58 | Warrant of imprisonment on forfeiture of bond for good behaviour | 491 |

*(Forms 5, 8, 14, 27, 35, 37, 40 print their section reference on a line the text extraction
merged with the title; the section shown as "—" should be re-read from the PDF before being
printed on any generated document.)*

---

## Appendix B — all sources used, by class

**(a) BNSS primary**
* India Code, Bharatiya Nagarik Suraksha Sanhita, 2023 (Act 46 of 2023), full text incl. Second
  Schedule — <https://www.indiacode.nic.in/bitstream/123456789/20099/1/A202346.pdf>
* Landing page — <https://www.indiacode.nic.in/handle/123456789/20099?locale=en>
* MHA copy — <https://www.mha.gov.in/sites/default/files/250883_english_01042024.pdf>

**(b) Gujarat-specific**
* The Gujarat Police Manual, Volume III (Powers and Duties), official DGP publication —
  <https://police.gujarat.gov.in/upload/DGPVol3_03032025.pdf>
  (r.142–145 medico-legal · r.169 identity of articles · r.178 muddamal register ·
  **r.180 panchnama** · **r.181 identification parade** · **r.218 remand** ·
  **r.231 charge-sheet (Form C.P.C. 20)** · r.232 final reports and A/B/C summaries)
* The Gujarat Police Manual, Volume II — <https://police.gujarat.gov.in/upload/DGPVol2_03032025.pdf>
* Real filed Gujarat charge-sheet (Naroda Patiya, SIT Gandhinagar, CS 98/09, Naroda P.S.,
  Ahmedabad) showing the 5-column cover format —
  <https://cjp.org.in/wp-content/uploads/2017/05/NP%20SIT%20Charge%20sheets.CC%2098.09%202-4-2009.pdf>
* Ancestor text with identical rule numbering (Bombay Police Manual Part III, r.218) —
  <https://www.mahapolice.gov.in/uploads/acts_rules/MumbaiPoliceManualPartIII.pdf>

**(b2) Other-State BNSS-era prescribed format**
* Government of Assam, Home (A) Dept., Notification under s.193 BNSS — Final Police Report Form —
  <https://homeandpolitical.assam.gov.in/sites/default/files/swf_utility_folder/departments/hp_assam_webcomindia_org_oid_3/menu/document/notification_under_section_193_of_bnss_2023.pdf>

**(c) National / other-State forms still in use**
* NCRB Integrated Investigation Forms I.I.F.-I to VII (FIR, Crime Details, **Arrest/Court
  Surrender**, **Property Search & Seizure**, Final Form/Report, Court Disposal, Result of
  Appeal) — <https://shillongpolice.gov.in/Police_Acts_Manual/07_Integrated_Investigation_Forms_NCRB_I.I.F._ITOVII.pdf>
* FORM IF5 — Final Form/Report — <https://police.py.gov.in/Police%20manual/Forms%20pdf/FORM-%20IF5.pdf>
* FORM IF3 — Arrest / Court Surrender Memo — <https://police.py.gov.in/Police%20manual/Forms%20pdf/FORM%20IF%203.pdf>
* Puducherry Police Manual Ch. XLIII — medico-legal requisition proforma —
  <https://police.py.gov.in/Police%20manual/Chapter%20PDF/CHAPTER%2043%20General%20Guidelines%20relating%20to%20Medico-legal,%20Narcotic,%20Gambling.pdf>
* Kerala Medico-Legal Code and Annexure 1 (formats) —
  <https://dhs.kerala.gov.in/wp-content/uploads/2020/04/code.pdf> ·
  <https://dhs.kerala.gov.in/wp-content/uploads/2020/04/annexure1.pdf>
* Custody warrant specimen (Bihar, structural reference only) —
  <https://patnahighcourt.gov.in/bslsa/PDF/UPLOADED/22.PDF>

**Platform / subordinate legislation**
* Meta Law Enforcement Guidelines — <https://www.meta.com/safety/communities/law/guidelines/>
* Meta LERS portal — <https://www.facebook.com/records> · WhatsApp — <https://www.whatsapp.com/records/login>
* IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, r.3(1)(j) —
  <https://indiankanoon.org/doc/125230782/>

**Related prior research already in this repo:** `research/police-document-formats.md`
(superseded in part by this file), `research/bsa-63-certificate-format.md`,
`research/digital-evidence-bsa-63.md`, `research/legal-framework-bns-bnss-bsa.md`.
