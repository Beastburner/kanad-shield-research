"""CrimeGPT FastAPI app — Kanad S.H.I.E.L.D. 2026, PS-69EEFDFB90B99.

REST API for the 4-agent FIR-to-document pipeline with evidence integrity and
an append-only audit log. See API_CONTRACT.md for the full frontend contract."""

from contextlib import asynccontextmanager
from pathlib import Path
from uuid import UUID

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import audit, documents, integrity, mocks, ocr, translate as translate_mod
from .db import close_pool, init_pool, pool
from .models import (
    AnalyzeResult,
    Case,
    CaseCreate,
    CaseFacts,
    CaseUpdate,
    DiaryEntry,
    Document,
    DocumentRequest,
    ExtractedFacts,
    FactsUpdate,
    MockBharatPolResponse,
    MockFIRRequest,
    MockFIRResponse,
    OcrResponse,
    TranslateRequest,
    TranslateResponse,
)
from .pipeline.agents import run_pipeline


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="CrimeGPT API", version="0.1.0", lifespan=lifespan)

# Frontend is a separate React app — allow it during the hackathon.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
async def _get_case_row(case_id: UUID):
    row = await pool().fetchrow("SELECT * FROM cases WHERE id = $1", case_id)
    if row is None:
        raise HTTPException(404, "case not found")
    return row


async def _diary(case_id: UUID, event_type: str, description: str):
    await pool().execute(
        "INSERT INTO case_diary (case_id, event_type, description) VALUES ($1,$2,$3)",
        case_id, event_type, description,
    )


# ---------------------------------------------------------------------------
# cases
# ---------------------------------------------------------------------------
@app.post("/cases", response_model=Case, status_code=201)
async def create_case(body: CaseCreate):
    row = await pool().fetchrow(
        "INSERT INTO cases (case_number, fir_narrative) VALUES ($1,$2) RETURNING *",
        body.case_number, body.fir_narrative,
    )
    await _diary(row["id"], "fir_filed", "FIR narrative recorded.")
    await audit.record("case.create", case_id=row["id"], after=dict(row))
    return Case(**dict(row))


@app.get("/cases", response_model=list[Case])
async def search_cases(q: str | None = None, limit: int = 50):
    """Search/list cases by keyword (case number or FIR narrative). PS: officers
    can retrieve old entries using keywords or case numbers."""
    if q:
        rows = await pool().fetch(
            """SELECT * FROM cases
               WHERE case_number ILIKE '%'||$1||'%' OR fir_narrative ILIKE '%'||$1||'%'
               ORDER BY created_at DESC LIMIT $2""",
            q, limit,
        )
    else:
        rows = await pool().fetch("SELECT * FROM cases ORDER BY created_at DESC LIMIT $1", limit)
    return [Case(**dict(r)) for r in rows]


@app.get("/cases/{case_id}", response_model=Case)
async def get_case(case_id: UUID):
    return Case(**dict(await _get_case_row(case_id)))


@app.patch("/cases/{case_id}", response_model=Case)
async def update_case(case_id: UUID, body: CaseUpdate):
    before = await _get_case_row(case_id)
    fields = body.model_dump(exclude_none=True)
    if not fields:
        return Case(**dict(before))
    sets = ", ".join(f"{k} = ${i}" for i, k in enumerate(fields, start=2))
    row = await pool().fetchrow(
        f"UPDATE cases SET {sets}, updated_at = now() WHERE id = $1 RETURNING *",
        case_id, *fields.values(),
    )
    await audit.record("case.update", case_id=case_id, before=dict(before), after=dict(row))
    return Case(**dict(row))


# ---------------------------------------------------------------------------
# facts
# ---------------------------------------------------------------------------
@app.get("/cases/{case_id}/facts", response_model=CaseFacts)
async def get_facts(case_id: UUID):
    await _get_case_row(case_id)
    row = await pool().fetchrow("SELECT * FROM case_facts WHERE case_id = $1", case_id)
    if row is None:
        raise HTTPException(404, "no facts yet — run /analyze first")
    return CaseFacts(case_id=case_id, facts=row["facts"], source=row["source"], updated_at=row["updated_at"])


@app.patch("/cases/{case_id}/facts", response_model=CaseFacts)
async def update_facts(case_id: UUID, body: FactsUpdate):
    await _get_case_row(case_id)
    before = await pool().fetchrow("SELECT facts FROM case_facts WHERE case_id = $1", case_id)
    new = body.facts.model_dump()
    row = await pool().fetchrow(
        """
        INSERT INTO case_facts (case_id, facts, source)
        VALUES ($1, $2, 'officer_edit')
        ON CONFLICT (case_id) DO UPDATE
          SET facts = $2, source = 'officer_edit', updated_at = now()
        RETURNING *
        """,
        case_id, new,
    )
    await audit.record(
        "facts.update", case_id=case_id,
        before=dict(before) if before else None, after={"facts": new},
    )
    await _diary(case_id, "facts_edited", "Officer edited extracted facts.")
    return CaseFacts(case_id=case_id, facts=row["facts"], source=row["source"], updated_at=row["updated_at"])


# ---------------------------------------------------------------------------
# analyze — runs the 4-agent pipeline
# ---------------------------------------------------------------------------
@app.post("/cases/{case_id}/analyze", response_model=AnalyzeResult)
async def analyze(case_id: UUID):
    case = await _get_case_row(case_id)
    try:
        result = await run_pipeline(case_id, case["fir_narrative"])
    except RuntimeError as e:
        raise HTTPException(502, f"pipeline error: {e}")

    # persist facts
    await pool().execute(
        """
        INSERT INTO case_facts (case_id, facts, source)
        VALUES ($1, $2, 'extraction_agent')
        ON CONFLICT (case_id) DO UPDATE
          SET facts = $2, source = 'extraction_agent', updated_at = now()
        """,
        case_id, result.facts.model_dump(),
    )
    # replace sections + judgments
    await pool().execute("DELETE FROM suggested_sections WHERE case_id = $1", case_id)
    for s in result.sections:
        await pool().execute(
            """INSERT INTO suggested_sections
               (case_id, code, section_no, heading, old_code_ref, confidence,
                rationale, statute_chunk_id, validated)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
            case_id, s.code, s.section_no, s.heading, s.old_code_ref, s.confidence,
            s.rationale, s.statute_chunk_id, s.validated,
        )
    await pool().execute("DELETE FROM suggested_judgments WHERE case_id = $1", case_id)
    for j in result.judgments:
        await pool().execute(
            """INSERT INTO suggested_judgments
               (case_id, indiankanoon_doc_id, title, relevance, tags)
               VALUES ($1,$2,$3,$4,$5)""",
            case_id, j.indiankanoon_doc_id, j.title, j.relevance, j.tags,
        )
    await pool().execute("UPDATE cases SET status = $2, updated_at = now() WHERE id = $1",
                         case_id, result.status)
    await _diary(case_id, "analyzed",
                 f"Pipeline run: {len(result.sections)} sections, confidence {result.confidence:.2f}.")
    await audit.record("case.analyze", case_id=case_id,
                       after={"status": result.status, "confidence": result.confidence})
    return result


# ---------------------------------------------------------------------------
# documents — generation + integrity
# ---------------------------------------------------------------------------
@app.post("/cases/{case_id}/documents", response_model=Document, status_code=201)
async def create_document(case_id: UUID, body: DocumentRequest):
    case = await _get_case_row(case_id)
    facts_row = await pool().fetchrow("SELECT facts FROM case_facts WHERE case_id = $1", case_id)
    if facts_row is None:
        raise HTTPException(409, "run /analyze before generating documents")
    facts = ExtractedFacts(**facts_row["facts"])
    sec_rows = await pool().fetch(
        "SELECT code, section_no, heading, old_code_ref, confidence FROM suggested_sections WHERE case_id = $1", case_id)
    from .models import SuggestedSection
    sections = [SuggestedSection(**dict(r)) for r in sec_rows]

    case_number = case["case_number"] or str(case_id)
    doc_path = documents.generate(body.type, case_number, facts, sections)
    sha = integrity.sha256_file(doc_path)
    cert_path = doc_path.replace(".docx", "_s63cert.docx")
    integrity.draft_s63_certificate(doc_path, sha, case_number, body.type, cert_path)

    row = await pool().fetchrow(
        """INSERT INTO documents (case_id, type, file_path, sha256, s63_cert_path)
           VALUES ($1,$2,$3,$4,$5) RETURNING *""",
        case_id, body.type, doc_path, sha, cert_path,
    )
    await _diary(case_id, "document_generated", f"Generated {body.type} (sha256 {sha[:12]}…).")
    await audit.record("document.generate", case_id=case_id, doc_id=row["id"], after=dict(row))
    await pool().execute("UPDATE cases SET status = 'documented', updated_at = now() WHERE id = $1", case_id)
    return Document(**dict(row))


@app.get("/cases/{case_id}/documents", response_model=list[Document])
async def list_documents(case_id: UUID):
    await _get_case_row(case_id)
    rows = await pool().fetch("SELECT * FROM documents WHERE case_id = $1 ORDER BY generated_at", case_id)
    return [Document(**dict(r)) for r in rows]


async def _doc_file(doc_id: UUID, column: str) -> str:
    """Look up a document's server-side path by id (never from client input)."""
    row = await pool().fetchrow(f"SELECT {column} FROM documents WHERE id = $1", doc_id)
    if row is None:
        raise HTTPException(404, "document not found")
    path = row[column]
    if not path or not Path(path).is_file():
        raise HTTPException(404, "file not available")
    return path


@app.get("/documents/{doc_id}/file")
async def download_document(doc_id: UUID):
    path = await _doc_file(doc_id, "file_path")
    return FileResponse(path, filename=Path(path).name)


@app.get("/documents/{doc_id}/certificate")
async def download_certificate(doc_id: UUID):
    path = await _doc_file(doc_id, "s63_cert_path")
    return FileResponse(path, filename=Path(path).name)


# ---------------------------------------------------------------------------
# diary
# ---------------------------------------------------------------------------
@app.get("/cases/{case_id}/diary", response_model=list[DiaryEntry])
async def get_diary(case_id: UUID):
    await _get_case_row(case_id)
    rows = await pool().fetch(
        "SELECT event_type, description, occurred_at FROM case_diary WHERE case_id = $1 ORDER BY occurred_at",
        case_id,
    )
    return [DiaryEntry(**dict(r)) for r in rows]


# ---------------------------------------------------------------------------
# mock integrations
# ---------------------------------------------------------------------------
@app.post("/mock/cctns/fir", response_model=MockFIRResponse)
async def mock_cctns_fir(body: MockFIRRequest):
    return mocks.mock_fir(body)


@app.get("/mock/bharatpol/lookup", response_model=MockBharatPolResponse)
async def mock_bharatpol_lookup(name: str):
    return mocks.mock_bharatpol(name)


@app.post("/ocr", response_model=OcrResponse)
async def ocr_ingest(file: UploadFile = File(...), lang: str = "eng"):
    """OCR a scanned FIR/document image into text (feed the result into POST /cases)."""
    data = await file.read()
    if not data:
        raise HTTPException(422, "empty file")
    try:
        text = ocr.extract_text(data, lang=lang)
    except ocr.OcrError as e:
        raise HTTPException(422, str(e))
    return OcrResponse(text=text, char_count=len(text), lang=lang)


@app.post("/translate", response_model=TranslateResponse)
async def translate_text(body: TranslateRequest):
    try:
        out = await translate_mod.translate(body.text, body.target, body.source)
    except RuntimeError as e:
        raise HTTPException(502, f"translation error: {e}")
    return TranslateResponse(target=body.target, text=out)


@app.get("/health")
async def health():
    return {"status": "ok"}
