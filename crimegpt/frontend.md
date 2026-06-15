# CrimeGPT — Frontend Build Guide

**PS-69EEFDFB90B99 · Kanad S.H.I.E.L.D. 2026**
For the team building the UI. The backend (FastAPI) is **done and running**; this doc tells you
what to build on top of it. For exact request/response schemas of every endpoint, see
[`backend/API_CONTRACT.md`](./backend/API_CONTRACT.md) — that is the source of truth; this guide
is the higher-level plan (stack, screens, demo flow, scoring).

---

## 0. Who you are building for (this drives every UI decision)

The judges are **police officers and government officials**, and the *users* are
**non-technical investigating officers (IOs)**. "User Experience and Interface Design" is an
**explicit scored criterion**. So:

- Big, clear, low-clutter screens. Minimal jargon. Workflow reads top-to-bottom like a case file.
- Every AI output must carry the label **"AI-assisted draft — officer review required."**
  (the backend already returns this string as `disclaimer` on relevant responses — display it).
- Nothing should ever look like the AI is "deciding" the law — it *suggests*, the officer *confirms*.

---

## 1. Tech stack

The PS suggests **React.js / Angular**. Use **React** (faster to demo, matches the backend's CORS
setup). Recommended concrete stack:

| Concern | Pick | Notes |
|---|---|---|
| Framework | **React 18 + Vite** | fast dev server, instant HMR |
| Language | TypeScript | optional but the API has clear shapes — types help |
| HTTP | `axios` or native `fetch` | base URL = `http://localhost:8000` |
| Routing | `react-router` | one route per screen below |
| UI kit | **Material UI** or **shadcn/ui** | officer-friendly, accessible components out of the box |
| State | React Query (TanStack) | handles loading/error for the async `/analyze` call cleanly |
| i18n | **`react-i18next`** | for the GU/HI/EN UI (see §5) |
| Forms | `react-hook-form` | the editable facts form |

> Backend stack (FYI, you don't touch it): FastAPI + PostgreSQL/pgvector + Groq LLaMA-3.3-70B +
> docxtpl. It already aligns with the PS suggested backend (Flask/Django family) and DB (PostgreSQL).

---

## 2. Connecting to the backend

```
Base URL:  http://localhost:8000
Swagger:   http://localhost:8000/docs        ← live, clickable, try every endpoint here first
OpenAPI:   http://localhost:8000/openapi.json ← generate a typed client if you want
```

- **CORS is already open** (`allow_origins=["*"]`), so a Vite dev server on `:5173` can call it directly.
- **No auth** — there are no tokens/headers to send. Just call the endpoints.
- All endpoints are **synchronous JSON**. `POST /cases/{id}/analyze` is the slow one (it runs the
  4 LLM agents — expect a few seconds); show a spinner. Everything else is fast.
- Error shape is standard FastAPI: `{ "detail": "..." }` with the HTTP status. See API_CONTRACT §"Common error shape".

To run the backend locally (ask the backend team, or):
```bash
cd backend && docker compose up -d && uvicorn app.main:app --port 8000
```

---

## 3. Screens to build

Seven screens. The **starred** ones are the demo critical path — build these first and make them flawless.

### A. Dashboard / Case List
- Lists recent cases; search box → `GET /cases?q=<keyword>` (matches case number or narrative).
- "New Case" button → screen B.
- Maps to PS "Search & Audit: retrieve old entries by keyword or case number".

### B. New Case ⭐
- Textarea for the **FIR narrative** + optional case number → `POST /cases`.
- "Import from CCTNS" button → `POST /mock/cctns/fir` (prefills the textarea with a realistic FIR).
- **"Upload scanned FIR"** (image file) → `POST /ocr` (multipart `file`) → prefill the textarea
  with the returned `text` for the officer to review/edit, then `POST /cases`.
- Narrative may be typed in **English, Hindi, or Gujarati** (the pipeline handles it).
- On success, stash the returned case `id`, go to screen C.

### C. Case Analysis ⭐ (the centerpiece)
Trigger `POST /cases/{id}/analyze`, then render its result:
- **Extracted facts** in an **editable form** (complainant, accused[], victims[], items[], events[],
  location, dates[]). Save edits via `PATCH /cases/{id}/facts`, then allow re-analyze.
- **Suggested legal sections** as cards. Each card shows:
  - `code` + `section_no` + `heading` (e.g. *BNS 303 — Theft*),
  - a **confidence bar** (`confidence` 0–1),
  - the **`old_code_ref`** cross-reference, clearly labelled as the *old equivalent*
    (e.g. *cf. IPC 378/379*) — **this is a PS requirement, make it visible**,
  - the `rationale`.
- **Suggested judgments** (Indian Kanoon) — `title` + tags.
- If `review_required` is `true` (or `status === "review_required"`): show a prominent
  **"Officer review required"** banner + the `validation_concerns` list + the `disclaimer`.
- "Generate documents" → screen D.

### D. Documents ⭐
- Buttons for each of the **7 document types** → `POST /cases/{id}/documents` with `{ "type": ... }`:
  `chargesheet`, `remand_request`, `seizure_receipt`, `court_custody_letter`,
  `accused_panchanama`, `medical_treatment_letter`, `face_identification_form`.
- After generation, list documents (`GET /cases/{id}/documents`) showing per doc:
  - the **SHA-256 hash** (integrity badge),
  - **Download .docx** → `GET /documents/{id}/file`,
  - **Download s.63 certificate** → `GET /documents/{id}/certificate`,
  - the `disclaimer`.
- Emphasize the SHA-256 + s.63 certificate visually — digital-evidence admissibility is a scored
  criterion and most teams won't have it.

### E. Case Diary
- `GET /cases/{id}/diary` → render a **vertical timeline** (fir_filed → analyzed →
  document_generated …). Maps to PS "Case Diary Integration" (a full scored criterion).

### F. Translate / Language tools (supports §5)
- A small utility (or inline buttons) → `POST /translate` `{ text, target: "hi"|"gu"|"en" }`.
- Use it to show generated section text / summaries in the officer's language on demand.

### G. (Optional) Mock integrations panel
- `GET /mock/bharatpol/lookup?name=...` — show the "integration-ready" story. Label it clearly as
  a simulated/mock lookup.

---

## 4. The demo flow (the 3 minutes that must not break)

Build the UI so this exact path is one smooth click-through:

```
1. New Case → paste/import an FIR narrative → Create
2. Analyze → show extracted facts + BNS/BNSS/BSA sections (with IPC cross-ref + confidence) + judgments
3. (optional) edit a fact → re-analyze to show it updates
4. Generate ≥2 documents live (chargesheet + remand) → show SHA-256 + download .docx + s.63 cert
5. Case Diary → show the FIR→arrest timeline filling in
```

Deliverable minimums (don't fall below): **≥4 documents available**, **≥2 generated live**, **legal
section + judgment suggestions shown**. We exceed all of these — just make sure the UI surfaces them.

---

## 5. Multilingual (Gujarati / Hindi / English) — REQUIRED + scored

This is a **functional requirement** *and* its own evaluation criterion ("Language Support and
Localization"), so don't skip it:

- **UI labels**: wire `react-i18next` with `en` / `hi` / `gu` resource files + a language switcher.
- **Content**: use `POST /translate` to translate dynamic content (section text, summaries) to the
  selected language on demand.
- **Input**: the FIR narrative box accepts Hindi/Gujarati directly (backend handles it).
- Demo tip: keep the **core demo in English** for reliability, but **show the language switcher
  working** on at least one screen (Gujarati especially — it's the local language).

---

## 6. Evaluation criteria → what your UI must show

| Scored criterion | What the frontend must surface |
|---|---|
| Accuracy of document generation | the 7 doc types, generated from shared case data, downloadable |
| Legal section mapping intelligence | section cards with code+heading+confidence+**IPC cross-ref**+judgments |
| UX for non-technical officers | clean top-to-bottom workflow, clear labels, disclaimers |
| Case diary integration | the timeline screen (E) |
| Language support | the GU/HI/EN switcher + `/translate` (§5) |
| Deliverable completeness | all screens wired; nothing dead-ends |
| Innovation | SHA-256 + s.63 evidence badges; CCTNS/BharatPol mock panels |

---

## 7. UX must-haves (easy points)

- Show the **`disclaimer`** string wherever the API returns it.
- Show **`confidence`** as a bar/percentage, not a raw number.
- Render `old_code_ref` as a muted/secondary chip (it's a reference, not the charge).
- Loading state on `/analyze` (it's the only slow call).
- Empty/error states: if `sections` is `[]` or `review_required`, show the review banner — never a blank screen.
- Format `occurred_at` / `generated_at` timestamps human-readably.

---

## 8. Notes / gotchas

- The backend writes `.docx` files server-side and streams them via the download routes — you don't
  handle files directly; just link to `GET /documents/{id}/file` and `/certificate`.
- `GET /cases/{id}/facts` returns **404 until `/analyze` has run** — call analyze first, or handle the 404.
- `POST /cases/{id}/documents` returns **409 if `/analyze` hasn't run** — gate the Documents screen on analysis being done.
- Charging sections are always BNS/BNSS/BSA; the IPC/CrPC/IEA value is a **cross-reference only** —
  label it that way so a police judge isn't confused.

---

## 9. Suggested build order (against the deadline)

1. Wire base API client + the **New Case → Analyze → Documents** path (screens B, C, D) — the demo spine.
2. Case Diary (E) + Dashboard/search (A).
3. Multilingual switcher + `/translate` (§5).
4. Polish: confidence bars, evidence badges, mock panels, empty/error states.

Pointer for every field name and example payload: **[`backend/API_CONTRACT.md`](./backend/API_CONTRACT.md)**.
