# CrimeGPT API Contract (Frontend Handoff)

**Base URL:** `http://localhost:8000`
**Content-Type:** `application/json` for all request bodies.
**Auth:** none (out of scope for the hackathon).
**CORS:** all origins allowed.

Interactive docs: `GET /docs` (Swagger), `GET /openapi.json` (machine-readable).

Every AI output carries `"disclaimer": "AI-assisted draft — officer review required."`
Always surface this in the UI. All legal codes are `BNS` | `BNSS` | `BSA` only.

### Common error shape (FastAPI default)

```json
{ "detail": "case not found" }
```

| Status | When |
|--------|------|
| 400 | malformed JSON |
| 404 | case / facts not found |
| 409 | precondition not met (e.g. generate document before analyze) |
| 422 | request body fails validation (FastAPI lists offending fields) |
| 502 | LLM pipeline error (e.g. missing `GROQ_API_KEY`, bad LLM output) |

---

## 1. Create case — `POST /cases`

Creates a case from an FIR narrative. Logs `fir_filed` to the diary.

**Request**
```json
{
  "fir_narrative": "On 12 June 2026 two unknown persons broke the lock of complainant Ramesh Patel's shop in Ahmedabad and stole a laptop and Rs 45000 cash. CCTV footage is available.",
  "case_number": "CR-2026-0042"
}
```
`case_number` is optional. `fir_narrative` min length 10.

**Response `201`**
```json
{
  "id": "1a2b3c4d-...",
  "case_number": "CR-2026-0042",
  "status": "new",
  "fir_narrative": "On 12 June 2026 ...",
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-06-15T10:00:00Z"
}
```
Errors: `422` (narrative too short / missing).

---

## 1a. Search / list cases — `GET /cases?q=<keyword>&limit=50`

Retrieve old cases by keyword (matches `case_number` or `fir_narrative`). Omit `q`
to list recent cases. Use for the "search old entries by keyword or case number"
requirement.

**Response `200`** — array of Case objects (newest first).

---

## 2. Get case — `GET /cases/{case_id}`

**Response `200`** — same shape as Create response.
Errors: `404`.

`status` values: `new` → `analyzed` | `review_required` → `documented`.

---

## 3. Update case — `PATCH /cases/{case_id}`

Edit status / case_number / narrative. Only send fields you want to change.

**Request**
```json
{ "status": "documented" }
```

**Response `200`** — updated case object. Errors: `404`.

---

## 4. Get facts — `GET /cases/{case_id}/facts`

Structured facts extracted by the pipeline (available after `/analyze`).

**Response `200`**
```json
{
  "case_id": "1a2b3c4d-...",
  "source": "extraction_agent",
  "updated_at": "2026-06-15T10:05:00Z",
  "facts": {
    "complainant": "Ramesh Patel",
    "accused": [],
    "victims": ["Ramesh Patel"],
    "items": ["laptop", "Rs 45000 cash"],
    "events": ["Two unknown persons broke the lock of the shop", "They stole a laptop and cash"],
    "location": "Ahmedabad",
    "dates": ["12 June 2026"]
  }
}
```
Errors: `404` (case missing, or no facts yet — run `/analyze` first).

---

## 5. Edit facts — `PATCH /cases/{case_id}/facts`

Officer correction of extracted facts. Overwrites the facts blob, sets
`source = "officer_edit"`, logs `facts_edited` to the diary, writes audit entry.

**Request**
```json
{
  "facts": {
    "complainant": "Ramesh Patel",
    "accused": ["Suresh Kumar"],
    "victims": ["Ramesh Patel"],
    "items": ["laptop", "Rs 45000 cash", "mobile phone"],
    "events": ["Broke lock of shop", "Stole laptop, cash and phone"],
    "location": "Ahmedabad, Gujarat",
    "dates": ["12 June 2026"]
  }
}
```
All `facts` sub-fields optional; omit `accused`/`items`/etc. → treated as empty list.

**Response `200`** — same shape as Get facts. Errors: `404`, `422`.

---

## 6. Analyze — `POST /cases/{case_id}/analyze`  ⭐ core

Runs the 4-agent pipeline: extraction → classification (RAG over BNS/BNSS/BSA) →
validation → judgment retrieval. Persists facts/sections/judgments, updates case
status, logs `analyzed` to the diary. **Requires `GROQ_API_KEY` to be set.**

No request body.

**Response `200`**
```json
{
  "case_id": "1a2b3c4d-...",
  "status": "analyzed",
  "confidence": 0.82,
  "review_required": false,
  "facts": { "...": "same shape as Get facts" },
  "sections": [
    {
      "code": "BNS",
      "section_no": "305",
      "heading": "Theft in a dwelling house etc.",
      "old_code_ref": "IPC 380 (theft in dwelling)",
      "confidence": 0.86,
      "rationale": "Property taken from a building used for custody of property.",
      "statute_chunk_id": "9f8e...",
      "validated": true
    }
  ],
  "judgments": [
    {
      "indiankanoon_doc_id": "IK-1000001",
      "title": "State of Gujarat v. Accused (theft of property)",
      "relevance": 0.82,
      "tags": ["theft", "dwelling", "intention"]
    }
  ],
  "validation_concerns": [],
  "disclaimer": "AI-assisted draft — officer review required."
}
```

When confidence < threshold (default 0.6) **or** no section survives validation:
```json
{
  "status": "review_required",
  "confidence": 0.41,
  "review_required": true,
  "sections": [],
  "validation_concerns": ["Confidence below threshold — officer review required.", "..."]
}
```
Errors: `404` (case missing), `502` (LLM error — show "AI analysis unavailable, retry").

**UI guidance:** show retrieved statute `heading`+`section_no` next to each suggestion
(the "retrieved statute text shown" requirement). If `review_required`, banner the
officer-review state and still allow manual document generation.

---

## 7. Generate document — `POST /cases/{case_id}/documents`  ⭐ core

Renders a police legal `.docx`, computes SHA-256, auto-drafts a BSA s.63 Part-A
certificate, logs `document_generated`, writes audit entry, sets case `documented`.
**Run `/analyze` first** (needs persisted facts).

**Request**
```json
{ "type": "chargesheet", "lang": "en" }
```
`type` ∈ `"chargesheet"` | `"remand_request"` | `"seizure_receipt"` | `"court_custody_letter"` | `"accused_panchanama"` | `"medical_treatment_letter"` | `"face_identification_form"` (all 7 PS document types).
`lang` ∈ `"en"` | `"hi"` | `"gu"` (default `"en"`) — generates the .docx in that language. Pass the UI's selected language. Translation is best-effort: if the LLM is unavailable it falls back to English (generation never fails).

**Response `201`**
```json
{
  "id": "7c6d5e...",
  "case_id": "1a2b3c4d-...",
  "type": "chargesheet",
  "file_path": "./artifacts/chargesheet_ab12cd34.docx",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "s63_cert_path": "./artifacts/chargesheet_ab12cd34_s63cert.docx",
  "generated_at": "2026-06-15T10:10:00Z",
  "disclaimer": "AI-assisted draft — officer review required."
}
```
Errors: `404` (case missing), `409` (analyze not run yet), `422` (bad `type`).

**Note:** files are written server-side to `ARTIFACT_DIR`; use the download routes
below (7a–7c) to fetch them. Keep the returned `id` to drive downloads.

---

## 7a. List documents — `GET /cases/{case_id}/documents`

Returns all generated documents for a case (same object shape as #7). Use after a
page reload to recover document `id`s for the download routes.

**Response `200`** — array of the `201` object from #7. Errors: `404` (case missing).

---

## 7b. Download document — `GET /documents/{doc_id}/file`

Streams the generated `.docx` (`Content-Disposition: attachment`). Path is looked
up server-side by `doc_id` — no file path is ever accepted from the client.
Errors: `404` (document or file missing).

## 7c. Download s.63 certificate — `GET /documents/{doc_id}/certificate`

Streams the BSA Section 63 Part-A certificate `.docx` for the document.
Errors: `404` (document or certificate missing).

---

## 8. Case diary — `GET /cases/{case_id}/diary`

Chronological investigative timeline (FIR → analysis → documents).

**Response `200`**
```json
[
  { "event_type": "fir_filed", "description": "FIR narrative recorded.", "occurred_at": "2026-06-15T10:00:00Z" },
  { "event_type": "analyzed", "description": "Pipeline run: 2 sections, confidence 0.82.", "occurred_at": "2026-06-15T10:05:00Z" },
  { "event_type": "document_generated", "description": "Generated chargesheet (sha256 e3b0c44298fc…).", "occurred_at": "2026-06-15T10:10:00Z" }
]
```
Errors: `404`. Event types: `fir_filed`, `analyzed`, `facts_edited`, `document_generated`.

---

## 9. Mock CCTNS FIR — `POST /mock/cctns/fir`

Simulated FIR record (integration-ready stub for ICJS/CCTNS). **MOCK** — flagged
via `"source": "MOCK_CCTNS"`. Useful to prefill an FIR narrative in the UI.

**Request**
```json
{ "district": "Ahmedabad", "complainant": "Ramesh Patel" }
```
Both optional (defaults: `Ahmedabad` / `Unknown`).

**Response `200`**
```json
{
  "cctns_fir_id": "CCTNS-9F2A1B7C0D",
  "district": "Ahmedabad",
  "police_station": "Ahmedabad City PS",
  "complainant": "Ramesh Patel",
  "fir_narrative": "On the night of 12 June 2026, the complainant Ramesh Patel reported ...",
  "registered_at": "2026-06-15T10:00:00Z",
  "source": "MOCK_CCTNS"
}
```

---

## 10. Mock BharatPol lookup — `GET /mock/bharatpol/lookup?name=...`

Simulated international lookup. **MOCK** — `"source": "MOCK_BHARATPOL"`.

**Query params:** `name` (required, string).

**Response `200`**
```json
{
  "query": "Suresh Kumar",
  "matches": [
    {
      "interpol_ref": "RN-2024-0098",
      "name": "Suresh Kumar",
      "wanted_for": "transnational fraud",
      "country": "UAE",
      "notice": "Red Notice (simulated)"
    }
  ],
  "source": "MOCK_BHARATPOL"
}
```
Errors: `422` (missing `name`).

---

## 11a. Translate — `POST /translate`  (multilingual I/O)

Translate any text between English / Hindi / Gujarati. Use for localized UI labels
and for showing generated output in the officer's language. (FIR narratives may
also be submitted directly in Hindi/Gujarati to `POST /cases` — the pipeline
handles multilingual input.)

**Request**
```json
{ "text": "Theft of motorcycle under BNS 303.", "target": "hi", "source": "auto" }
```
`target` / `source` ∈ `"en"` | `"hi"` | `"gu"` (`source` also accepts `"auto"`).

**Response `200`**
```json
{ "target": "hi", "text": "मोटरसाइकिल की चोरी BNS 303 के तहत।" }
```
Errors: `422` (bad lang/empty text), `502` (LLM/translation error).

---

## 11b. OCR scanned FIR — `POST /ocr`  (multipart)

Extract text from a scanned FIR / document — **image** (PNG/JPG/TIFF) or **PDF** —
so officers can ingest paper documents. Digital PDFs use the embedded text layer
(exact); scanned PDFs and images are OCR'd. Send as `multipart/form-data` with a
`file` field; optional `lang` query param (`eng` default; `hin`, `guj`, or `eng+hin`
if the language pack is installed). Pipe the returned `text` into `POST /cases`.

**Request** — `multipart/form-data`, field `file=<image|pdf>`; e.g. `POST /ocr?lang=eng`

**Response `200`**
```json
{ "text": "On 12 June 2026 ... CCTV footage is available.", "char_count": 412, "lang": "eng", "source": "pdf_text" }
```
`source` ∈ `"image_ocr"` | `"pdf_text"` (digital PDF) | `"pdf_ocr"` (scanned PDF).
Errors: `422` (empty/unreadable file, or Tesseract binary not installed on host).

**Frontend use:** on the New Case screen, an "Upload scanned FIR" control → `POST /ocr` →
prefill the narrative textarea with `text` → officer reviews/edits → `POST /cases`.

---

## 11. Health — `GET /health`

`200` → `{ "status": "ok" }`. Use for readiness checks.

---

## How the frontend should drive the demo

Maps directly to the README demo path (3-minute, no dead ends):

1. **Intake screen.** Either let the officer type the FIR narrative, or click
   "Import from CCTNS" → `POST /mock/cctns/fir` and prefill the textarea.
2. **Create case** → `POST /cases`. Stash the returned `id`. Show status `new`.
3. **Analyze** → `POST /cases/{id}/analyze`. Render:
   - extracted `facts` in an editable form,
   - `sections` as cards (code + section_no + heading + confidence bar + rationale),
   - `judgments` list (Indian Kanoon),
   - if `review_required`, a prominent officer-review banner + the disclaimer.
4. **(Optional) Correct facts** → `PATCH /cases/{id}/facts`, then re-`analyze`.
5. **Generate documents** → `POST /cases/{id}/documents` twice
   (`chargesheet`, then `remand_request`) — satisfies "≥2 live generations".
   Show each `sha256` and the disclaimer, with **Download .docx**
   (`GET /documents/{id}/file`) and **Download s.63 certificate**
   (`GET /documents/{id}/certificate`) buttons using the returned `id`.
6. **Case diary** → `GET /cases/{id}/diary`, render as a vertical timeline.

**Polling/async:** all endpoints are synchronous; `/analyze` may take a few
seconds (LLM). Show a spinner; no polling needed.

### Endpoint coverage checklist

- [x] POST /cases
- [x] GET /cases   (search/list, ?q=)
- [x] GET /cases/{id}
- [x] PATCH /cases/{id}
- [x] GET /cases/{id}/facts
- [x] PATCH /cases/{id}/facts
- [x] POST /cases/{id}/analyze
- [x] POST /cases/{id}/documents
- [x] GET /cases/{id}/documents
- [x] GET /documents/{id}/file
- [x] GET /documents/{id}/certificate
- [x] GET /cases/{id}/diary
- [x] POST /mock/cctns/fir
- [x] GET /mock/bharatpol/lookup
- [x] POST /translate
- [x] POST /ocr   (multipart, scanned FIR → text)
- [x] GET /health
