"""Stage 4 — GENERATION. Builds police legal documents as .docx.

Three document types: chargesheet, remand_request, seizure_receipt. Each is its
own builder function so swapping in a real reverse-engineered Gujarat-police
format later is isolated to one function (and/or a docxtpl .docx template).

We use docxtpl-style rendering via python-docx directly here for portability
(no binary template files to ship). The render context dicts are the seam: drop
a real .docx template + DocxTemplate.render(context) using the SAME context."""

import uuid
from datetime import datetime, timezone
from pathlib import Path

from docx import Document as Docx

from .config import settings
from .models import DISCLAIMER, DocType, ExtractedFacts, SuggestedSection


def _facts_lines(facts: ExtractedFacts) -> list[tuple[str, str]]:
    return [
        ("Complainant", facts.complainant or "—"),
        ("Accused", ", ".join(facts.accused) or "—"),
        ("Victim(s)", ", ".join(facts.victims) or "—"),
        ("Location", facts.location or "—"),
        ("Date(s)", ", ".join(facts.dates) or "—"),
    ]


def _sections_text(sections: list[SuggestedSection]) -> str:
    if not sections:
        return "No validated sections — officer review required."
    parts = []
    for s in sections:
        line = f"{s.code} s.{s.section_no} ({s.heading})"
        if s.old_code_ref:
            line += f" [cf. {s.old_code_ref}]"
        parts.append(line)
    return "; ".join(parts)


def _base(title: str) -> Docx:
    d = Docx()
    d.add_heading(title, level=1)
    p = d.add_paragraph(DISCLAIMER)
    p.runs[0].italic = True
    return d


def _build_chargesheet(d: Docx, facts, sections, case_number):
    d.add_heading("Final Report / Charge Sheet (under BNSS)", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Applicable Sections", level=2)
    d.add_paragraph(_sections_text(sections))
    d.add_heading("Brief Facts", level=2)
    for i, ev in enumerate(facts.events, 1):
        d.add_paragraph(f"{i}. {ev}")
    if facts.items:
        d.add_heading("Property Involved", level=2)
        for it in facts.items:
            d.add_paragraph(f"- {it}")


def _build_remand_request(d: Docx, facts, sections, case_number):
    d.add_heading("Application for Police Custody Remand (under BNSS)", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Sections Invoked", level=2)
    d.add_paragraph(_sections_text(sections))
    d.add_heading("Grounds for Remand", level=2)
    d.add_paragraph(
        "Custodial interrogation of the accused is sought to advance the "
        "investigation in respect of the following facts:"
    )
    for i, ev in enumerate(facts.events, 1):
        d.add_paragraph(f"{i}. {ev}")


def _build_seizure_receipt(d: Docx, facts, sections, case_number):
    d.add_heading("Seizure Memo / Receipt (under BNSS)", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Seized Items", level=2)
    if facts.items:
        table = d.add_table(rows=1, cols=2)
        table.style = "Light Grid Accent 1"
        table.rows[0].cells[0].text = "S.No"
        table.rows[0].cells[1].text = "Description"
        for i, it in enumerate(facts.items, 1):
            cells = table.add_row().cells
            cells[0].text = str(i)
            cells[1].text = it
    else:
        d.add_paragraph("No items recorded.")
    d.add_heading("Applicable Sections", level=2)
    d.add_paragraph(_sections_text(sections))


def _build_court_custody_letter(d: Docx, facts, sections, case_number):
    d.add_heading("Letter for Judicial (Court) Custody (under BNSS)", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Sections Invoked", level=2)
    d.add_paragraph(_sections_text(sections))
    d.add_heading("Request", level=2)
    d.add_paragraph(
        "The accused named above is forwarded to the Hon'ble Court with a request "
        "to authorise judicial custody pending further investigation, on the "
        "following grounds:"
    )
    for i, ev in enumerate(facts.events, 1):
        d.add_paragraph(f"{i}. {ev}")


def _build_accused_panchanama(d: Docx, facts, sections, case_number):
    d.add_heading("Accused Panchanama (Arrest / Personal Search Memo)", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Articles Found on Person / Recovered", level=2)
    if facts.items:
        for i, it in enumerate(facts.items, 1):
            d.add_paragraph(f"{i}. {it}")
    else:
        d.add_paragraph("Nil.")
    d.add_heading("Sections Invoked", level=2)
    d.add_paragraph(_sections_text(sections))
    d.add_heading("Panch Witnesses", level=2)
    d.add_paragraph("1. Name & address: ____________________  Signature: __________")
    d.add_paragraph("2. Name & address: ____________________  Signature: __________")


def _build_medical_treatment_letter(d: Docx, facts, sections, case_number):
    d.add_heading("Letter for Medical Examination / Treatment", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    d.add_paragraph("To: The Medical Officer / Superintendent, ____________________ Hospital")
    _kv_table(d, _facts_lines(facts))
    d.add_heading("Request", level=2)
    d.add_paragraph(
        "You are requested to conduct the medical examination and provide necessary "
        "treatment for the person named below in connection with the above case, and "
        "to furnish a medico-legal certificate (MLC) for evidentiary purposes:"
    )
    person = facts.victims[0] if facts.victims else (facts.accused[0] if facts.accused else "____________________")
    _kv_table(d, [
        ("Person to be examined", person),
        ("Nature of injuries / purpose", "____________________"),
        ("Date & time of incident", ", ".join(facts.dates) or "—"),
    ])
    d.add_heading("Sections Invoked", level=2)
    d.add_paragraph(_sections_text(sections))


def _build_face_identification_form(d: Docx, facts, sections, case_number):
    d.add_heading("Accused Face Identification Form", level=2)
    d.add_paragraph(f"Case Number: {case_number}")
    accused = ", ".join(facts.accused) or "____________________"
    _kv_table(d, [
        ("Accused name / alias", accused),
        ("Approximate age", "____________________"),
        ("Height / build", "____________________"),
        ("Complexion", "____________________"),
        ("Identifying marks (scar/tattoo/mole)", "____________________"),
        ("Last seen location", facts.location or "—"),
    ])
    d.add_heading("Photograph", level=2)
    d.add_paragraph("[ Affix / attach accused photograph or captured image here ]")
    d.add_heading("Identified By (witness)", level=2)
    d.add_paragraph("Name & address: ____________________  Signature: ____________________")
    d.add_heading("Sections Invoked", level=2)
    d.add_paragraph(_sections_text(sections))


def _kv_table(d: Docx, rows: list[tuple[str, str]]):
    table = d.add_table(rows=0, cols=2)
    table.style = "Light Grid Accent 1"
    for k, v in rows:
        cells = table.add_row().cells
        cells[0].text = k
        cells[1].text = v


_BUILDERS = {
    "chargesheet": _build_chargesheet,
    "remand_request": _build_remand_request,
    "seizure_receipt": _build_seizure_receipt,
    "court_custody_letter": _build_court_custody_letter,
    "accused_panchanama": _build_accused_panchanama,
    "medical_treatment_letter": _build_medical_treatment_letter,
    "face_identification_form": _build_face_identification_form,
}

_TITLES = {
    "chargesheet": "CHARGE SHEET",
    "remand_request": "REMAND REQUEST",
    "seizure_receipt": "SEIZURE RECEIPT",
    "court_custody_letter": "COURT CUSTODY LETTER",
    "accused_panchanama": "ACCUSED PANCHANAMA",
    "medical_treatment_letter": "MEDICAL TREATMENT LETTER",
    "face_identification_form": "ACCUSED FACE IDENTIFICATION FORM",
}


def generate(
    doc_type: DocType,
    case_number: str,
    facts: ExtractedFacts,
    sections: list[SuggestedSection],
) -> str:
    """Render a document to .docx and return its file path."""
    Path(settings.artifact_dir).mkdir(parents=True, exist_ok=True)
    d = _base(_TITLES[doc_type])
    _BUILDERS[doc_type](d, facts, sections, case_number)
    d.add_paragraph("")
    p = d.add_paragraph(
        f"Generated (UTC): {datetime.now(timezone.utc).isoformat()} — {DISCLAIMER}"
    )
    p.runs[0].italic = True

    fname = f"{doc_type}_{uuid.uuid4().hex[:8]}.docx"
    out_path = str(Path(settings.artifact_dir) / fname)
    d.save(out_path)
    return out_path
