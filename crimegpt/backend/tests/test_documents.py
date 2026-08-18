"""Claim 1 — all eight document types generate.

The pitch names eight documents by type. `documents._BUILDERS` is a dispatch
dict, so a type that is listed in the `DocType` literal but missing (or broken)
in the dict fails only at the moment an officer clicks it. These tests exercise
every builder end-to-end through the API so that failure surfaces in CI, not on
stage.

No LLM is involved: generation is pure python-docx templating over facts that
conftest seeds directly.
"""

import re
from pathlib import Path

import pytest
from docx import Document as Docx

from .conftest import H_IO

ALL_DOC_TYPES = [
    "chargesheet",
    "remand_request",
    "seizure_receipt",
    "court_custody_letter",
    "accused_panchanama",
    "medical_treatment_letter",
    "face_identification_form",
    "lers_request",
    "appearance_notice",   # BNSS Second Schedule Form No. 1 — the one statutory form
]


@pytest.mark.parametrize("doc_type", ALL_DOC_TYPES)
def test_document_type_generates_file_hash_and_certificate(client, case, doc_type):
    """One test per type: a .docx that python-docx can reopen, a 64-hex SHA-256
    and an s.63 certificate path that exists. Anything less is not a document an
    officer could file."""
    response = client.post(
        f"/cases/{case}/documents", json={"type": doc_type}, headers=H_IO
    )
    assert response.status_code == 201, response.text
    body = response.json()

    assert body["type"] == doc_type

    doc_path = Path(body["file_path"])
    assert doc_path.is_file(), f"{doc_type}: no .docx written to {doc_path}"
    assert doc_path.stat().st_size > 0
    # Reopening proves it is a valid OOXML package, not an empty/corrupt file.
    assert len(Docx(str(doc_path)).paragraphs) > 0

    assert re.fullmatch(r"[0-9a-f]{64}", body["sha256"]), body["sha256"]

    assert body["s63_cert_path"], f"{doc_type}: no s.63 certificate path recorded"
    assert Path(body["s63_cert_path"]).is_file()


def test_document_types_are_listed_back_for_the_case(client, case):
    """The workspace lists a case's documents; a generate that never lands in
    `documents` would leave the officer with a file they cannot find again."""
    for doc_type in ("chargesheet", "lers_request"):
        assert client.post(
            f"/cases/{case}/documents", json={"type": doc_type}, headers=H_IO
        ).status_code == 201

    listed = client.get(f"/cases/{case}/documents").json()
    assert {d["type"] for d in listed} == {"chargesheet", "lers_request"}


def test_generation_is_refused_before_analysis(client, case_factory):
    """Documents must not be fabricated from an unanalysed case — the sections
    block would be empty and the draft legally meaningless."""
    unanalysed = case_factory(analyzed=False)
    response = client.post(
        f"/cases/{unanalysed}/documents", json={"type": "chargesheet"}, headers=H_IO
    )
    assert response.status_code == 409
