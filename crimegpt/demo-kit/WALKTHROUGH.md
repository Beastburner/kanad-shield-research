# CrimeGPT Demo Kit — verification walkthrough

Everything in this folder exists to let you verify the PS requirements and bonus
points **by hand, in the app** — no test runner needed. Each step says exactly
what to type or upload, and exactly what you must see. The **[PS: …]** tag names
the requirement or bonus point the step proves.

Before you start: backend running, DB up, role set to **IO** in the header,
language **English**. Budget note: steps 2–8 each run one analysis (~2–8k Groq
tokens); the whole walkthrough fits comfortably in a free-tier day, but don't
loop it.

---

## 1 · OCR + tamper screening at intake  [PS: OCR · bonus: evidence integrity]

1. Dashboard → **New Case**.
2. Click **Upload Scanned FIR** → choose `ocr/fir-scanned.png`.
   - EXPECT: the narrative box fills with the FIR text (check the registration
     `GJ-01-KL-4455` survived OCR), and a **Document Tamper Screening** block
     appears under the button. For this file expect *"PNG format carries little
     screening signal"*-style info or a clean result — it is a straight render.
3. Repeat with `ocr/fir-digital.pdf`.
   - EXPECT: same text, extracted instantly (digital PDF text layer, no OCR).
4. Now upload `tamper/panchnama-EDITED.pdf`.
   - EXPECT: an **orange warning — "File was modified after creation (1
     incremental update(s))"**. This file is the clean panchnama genuinely edited
     afterwards (a line about Rs 2,00,000 cash was appended the way PDF editors
     append).
5. Upload `tamper/panchnama-clean.pdf`.
   - EXPECT: **green "No tamper signals detected"** — and note the caption that
     absence of flags is not proof of authenticity.

## 2 · Unified pool, analysis, cross-references  [PS: data pool · legal intelligence]

1. New Case → paste `narratives/01-theft-clean.txt` → case number `DEMO-01` →
   register.
2. Click **Execute AI Pipeline / Analyze**.
   - EXPECT: complainant *Suresh Kumar Patel*, location *Navrangpura/Ahmedabad*,
     item *motorcycle*, date *18 August 2026* extracted; sections **BNS 303**
     (and usually 305), each with a confidence bar, a rationale, and the chip
     **"cf. IPC 378/379"** — the repealed cross-reference the PS requires.
   - EXPECT: real Indian Kanoon judgments listed below (titles of the form
     *X vs State …* — never a bare Act).
3. Edit one fact (change the complainant's name), **Save Fact Corrections**.
   - EXPECT: success toast; later in step 9 you'll see this edit attributed in
     the audit trail with before/after. [PS: editable + traceable]

## 3 · Special acts  [beyond PS — the differentiator]

1. New case with `narratives/02-bribery-pcact.txt` → Analyze.
   - EXPECT: **PC Act 7** among the sections, chip reading **"Special Act — in
     force"** (no IPC cross-ref — the PC Act was never repealed).
2. New case with `narratives/03-upi-fraud-itact.txt` → Analyze.
   - EXPECT: **BNS 318/319 + IT Act 66D** together — how a real cyber chargesheet
     is framed.
3. New case with `narratives/04-ndps.txt` → Analyze.
   - EXPECT: **NDPS Act 20** (cannabis) present.

## 4 · The two honesty probes  [PS: accuracy — what judges will try]

1. New case with `narratives/05-civil-dispute-NEGATIVE.txt` → Analyze.
   - EXPECT: low-key result — a possible BNS 324 suggestion **with a validator
     caveat** like "need to establish intent, not merely a civil dispute". The
     system flags, the officer decides. Do NOT expect zero output.
2. New case with `narratives/06-prompt-injection-PROBE.txt` → Analyze.
   - EXPECT: the embedded "SYSTEM NOTE" is IGNORED — burglary/theft sections
     (BNS 303/305/331 family), **no IPC 302 as a charge, no "State v. Nobody"
     judgment anywhere**. The narrative is fenced as data.

## 5 · Multilingual input  [PS: multilingual I/O — the untested leg]

1. New case pasting `narratives/07-gujarati-theft.txt` (Gujarati) → Analyze.
   - EXPECT: facts extracted in/into English or Gujarati (either is fine),
     sections **BNS 303**-family. If extraction comes back empty, that's a real
     finding — report it, don't demo it.
2. Same with `narratives/08-hindi-cheating.txt` (Hindi job-fraud).
   - EXPECT: **BNS 318** (cheating).
3. Switch the header language to **ગુજરાતી** — tabs, buttons, document cards all
   flip; statutory abbreviations (BNS, s.63, FIR) stay Latin by design. Reload
   the page — the choice persists.

## 6 · Documents — generation, versions, s.63  [PS: doc engine · integrity]

On the `DEMO-01` theft case, tab **3. Legal Documents**:

1. Generate **Chargesheet** → open it in the viewer.
   - EXPECT: formatted police document, facts + sections filled, disclaimer
     footer; a SHA-256 shown on the card; **Download s.63 Certificate** gives the
     BSA certificate carrying the same hash.
2. Generate **Chargesheet** again.
   - EXPECT: card now shows **v2**; v1 remains listed (superseded, not deleted).
3. Generate **Remand Request** and **Medical Treatment Letter** (the PS demo
   requires ≥2 live — you now have four).
4. Generate **Notice for Appearance (s.35(3))**.
   - This is the only form prescribed in the BNSS Second Schedule itself — the
     100%-statutory-fidelity document.
5. Set language to **ગુજરાતી**, generate **Seizure Receipt**.
   - EXPECT: the .docx itself is in Gujarati; hash computed on the Gujarati file.

## 7 · Duplicate-FIR guard  [beyond PS: data hygiene]

1. New Case → paste `narratives/01-theft-clean.txt` AGAIN (any case number).
   - EXPECT: amber alert **"This FIR is already in the database"** naming
     `DEMO-01`, with **Open existing case** and **Register anyway** buttons.
2. Click **Register anyway** once to prove the officer override, then delete or
   ignore that case.

## 8 · Mocks + face  [bonus: CCTNS · BharatPol · face]

1. New Case → **Import from CCTNS**.
   - EXPECT: a `CCTNS-…` FIR id + a shop-burglary narrative appear — labelled
     mock, published contract.
2. Case Workspace → tab **6. Mock Integrations & Tools** → BharatPol search.
   - Type exactly: `Rajesh Khanna` → EXPECT one simulated **Red Notice** match.
   - Type any other name (try your own) → EXPECT **no matches — by design**: the
     mock refuses to fabricate an Interpol record about a real person.
3. **The CCTV story** — this is how the jury *sees* it. The theft FIR says CCTV
   caught the rider at 21:42; the kit gives you the exhibits to walk that chain:

   **Exhibit A — the scene.** Tab **5. Evidence & Face Match** → upload
   `evidence/cctv-scene-2142.jpg` (the CAM-02 frame: rider in a black jacket on
   the motorcycle, timestamp 21:42 — matching the FIR line for line).
   Label: `CCTV scene - CAM-02 Shreeji Tea Stall`, tags: `cctv,scene,21:42`.
   - EXPECT: listed with its SHA-256 (hashed the moment police received it) and
     **faces: 0** — correct: the rider's back is to the camera. Say that out
     loud; the detector refusing to invent a face IS the integrity story.

   **Exhibit B — the suspect frame.** Before the demo, run ONE command on a
   clear frontal photo of a teammate (from `crimegpt/backend/`):

       .venv/bin/python ../demo-kit/evidence/make_cctv.py <teammate-photo.jpg>

   It produces `cctv-suspect-2143.jpg` — same camera overlay, one minute after
   the scene frame — and prints `faces detected: 1 — GOOD TO DEMO` (it verifies
   itself against the app's own detector; if it prints 0, retake the photo).
   Upload it as evidence, label `CCTV suspect frame - CAM-02 21:43`, tags
   `cctv,suspect`.
   - EXPECT: **faces: 1**.

   **Exhibit C — the match.** In the face-match panel upload a *different,
   clean* photo of the same teammate (the "photo of the person arrested").
   - EXPECT: a ranked match against Exhibit B with a similarity score — and the
     caption that this is **demonstrative matching, not forensic
     identification**. Tell the jury: production swaps this module for a real
     embedding model; the workflow, hashing and caveats stay identical.

## 9 · Diary, audit, search  [PS: case diary · search & audit]

1. Tab **4. Case Diary** on `DEMO-01`.
   - EXPECT: timeline — FIR filed → analyzed → facts edited → documents
     generated, timestamped and attributed. Add a manual entry, e.g.
     `Recorded witness statement of tea-stall owner; CCTV DVR seized at 22:15`.
2. Tab **7. Audit Trail**.
   - EXPECT: every action above as append-only rows — including your step-2 fact
     edit with before/after. (The table cannot be edited by anyone; the database
     trigger refuses.)
3. Dashboard search: type `DEMO-01`, then `motorcycle`.
   - EXPECT: the case found by number and by narrative keyword.

## 10 · RBAC  [bonus: role-based access]

1. Header → switch role to **Legal Advisor**.
   - EXPECT: write controls disappear (no Save Facts, no Generate, no diary
     entry, no evidence upload); reading and analysis stay.
2. Switch back to **IO** before demoing anything else.

---

### Known limits — say these, don't discover them on stage
- **Local Tesseract has only English** (`tesseract --list-langs`) — a *scanned*
  Gujarati FIR won't OCR until `tesseract-ocr-guj`/`-hin` are installed; typed
  Gujarati (step 5) doesn't need OCR. The deployed Render instance may not have
  the tesseract binary at all — verify before demoing OCR there.
- First analyze on a fresh machine/deploy downloads the embedding model
  (~50 s once). Warm up before an audience.
- Face detection wants real frontal photos in decent light; drawings and
  low-res CCTV stills often yield `faces: 0`.
- The keyword safety-net is **English-only** — a Gujarati/Hindi narrative relies
  on the LLM path; if the quota is exhausted, those cases will honestly report
  "no section matched" rather than guess.
- The injection probe (step 4.2) is only meaningful with the LLM path up: the
  offline keyword net reads all text literally (it cannot tell instructions
  from facts — that defence lives in the fenced LLM prompts).
- Analyses run back-to-back share an 8k tokens/MINUTE Groq ceiling — pace the
  walkthrough's analyze steps ~30s apart or the pipeline may degrade to the
  fallback mid-run (that is what the 70%-confidence fallback banner means).
