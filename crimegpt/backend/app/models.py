"""Pydantic v2 models — API request/response contracts + pipeline payloads.
These mirror db/schema.sql. Field names match the API_CONTRACT.md examples."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

LegalCode = Literal["BNS", "BNSS", "BSA"]
DocType = Literal[
    "chargesheet", "remand_request", "seizure_receipt",
    "court_custody_letter", "accused_panchanama",
    "medical_treatment_letter", "face_identification_form",
]

DISCLAIMER = "AI-assisted draft — officer review required."


# ---- cases ---------------------------------------------------------------
class CaseCreate(BaseModel):
    fir_narrative: str = Field(min_length=10)
    case_number: str | None = None


class CaseUpdate(BaseModel):
    status: str | None = None
    case_number: str | None = None
    fir_narrative: str | None = None


class Case(BaseModel):
    id: UUID
    case_number: str | None
    status: str
    fir_narrative: str
    created_at: datetime
    updated_at: datetime


# ---- facts ---------------------------------------------------------------
class ExtractedFacts(BaseModel):
    """Structured output of the extraction agent. All fields optional so the
    LLM can omit what the narrative doesn't contain."""

    complainant: str | None = None
    accused: list[str] = []
    victims: list[str] = []
    items: list[str] = []          # stolen / seized property
    events: list[str] = []         # ordered sequence of what happened
    location: str | None = None
    dates: list[str] = []

    @field_validator("accused", "victims", "items", "events", "dates", mode="before")
    @classmethod
    def _clean_list(cls, v):
        # LLMs emit null for an absent list, or [null]/[123] inside one — coerce to
        # a clean list[str] so a missing/odd field never fails validation mid-pipeline.
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x) for x in v if x is not None]
        return v


class CaseFacts(BaseModel):
    case_id: UUID
    facts: ExtractedFacts
    source: str
    updated_at: datetime


class FactsUpdate(BaseModel):
    facts: ExtractedFacts


# ---- sections / judgments ------------------------------------------------
class SuggestedSection(BaseModel):
    code: LegalCode
    section_no: str
    heading: str | None = None
    old_code_ref: str | None = None   # repealed IPC/CrPC/IEA cross-reference (PS requirement)
    confidence: float = Field(ge=0, le=1)
    rationale: str | None = None
    statute_chunk_id: UUID | None = None
    validated: bool = False


class SuggestedJudgment(BaseModel):
    indiankanoon_doc_id: str
    title: str | None = None
    relevance: float = Field(ge=0, le=1)
    tags: list[str] = []


# ---- analyze (pipeline result) -------------------------------------------
class AnalyzeResult(BaseModel):
    case_id: UUID
    status: str                                # analyzed | review_required
    confidence: float
    review_required: bool
    facts: ExtractedFacts
    sections: list[SuggestedSection]
    judgments: list[SuggestedJudgment]
    validation_concerns: list[str] = []
    disclaimer: str = DISCLAIMER


# ---- documents -----------------------------------------------------------
class DocumentRequest(BaseModel):
    type: DocType


class Document(BaseModel):
    id: UUID
    case_id: UUID
    type: str
    file_path: str
    sha256: str
    s63_cert_path: str | None
    generated_at: datetime
    disclaimer: str = DISCLAIMER


# ---- diary ---------------------------------------------------------------
class DiaryEntry(BaseModel):
    event_type: str
    description: str
    occurred_at: datetime


# ---- mocks ---------------------------------------------------------------
class MockFIRRequest(BaseModel):
    district: str = "Ahmedabad"
    complainant: str = "Unknown"


class MockFIRResponse(BaseModel):
    cctns_fir_id: str
    district: str
    police_station: str
    complainant: str
    fir_narrative: str
    registered_at: datetime
    source: str = "MOCK_CCTNS"


class MockBharatPolResponse(BaseModel):
    query: str
    matches: list[dict[str, Any]]
    source: str = "MOCK_BHARATPOL"


# ---- translation (multilingual I/O) --------------------------------------
class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)
    target: Literal["en", "hi", "gu"]
    source: Literal["en", "hi", "gu", "auto"] = "auto"


class TranslateResponse(BaseModel):
    target: str
    text: str


# ---- OCR ingestion -------------------------------------------------------
class OcrResponse(BaseModel):
    text: str
    char_count: int
    lang: str
