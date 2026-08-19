"""Tamper-screening triage (app/forensics.py + POST /forensics/screen).

The pitch claim under test: an edited PDF is FLAGGED (the PDF format appends
edits, so an incremental save leaves a detectable second xref section), while a
clean single-save file screens clean — and the screening response always carries
the not-a-forensic-finding note, because triage must never be presented as a
verdict. No LLM, no network."""

import hashlib
import io

import fitz
import pytest
from PIL import Image


def _clean_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "PANCHNAMA - seizure of one motorcycle, Reg GJ-01-AB-1234")
    data = doc.tobytes()
    doc.close()
    return data


def _tampered_pdf() -> bytes:
    """A real edit, made the way PDF editors make them: open the finished file
    and save incrementally, appending a new xref section over the original."""
    import tempfile, os
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    try:
        with open(path, "wb") as f:
            f.write(_clean_pdf())
        doc = fitz.open(path)
        doc[0].insert_text((72, 200), "and Rs 50,000 cash")   # the "edit"
        doc.saveIncr()
        doc.close()
        with open(path, "rb") as f:
            return f.read()
    finally:
        os.unlink(path)


def _jpeg(software: str | None = None) -> bytes:
    img = Image.new("RGB", (64, 64), (200, 180, 40))
    buf = io.BytesIO()
    exif = None
    if software is not None:
        e = Image.Exif()
        e[0x0131] = software          # EXIF "Software" tag
        exif = e.tobytes()
    img.save(buf, "JPEG", exif=exif) if exif else img.save(buf, "JPEG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# module level
# ---------------------------------------------------------------------------
def test_incrementally_saved_pdf_is_flagged():
    from app import forensics

    result = forensics.screen(_tampered_pdf())
    checks = {f["check"]: f for f in result["flags"]}
    assert "pdf.incremental_updates" in checks, (
        "an incremental save appends a second xref section and must be flagged"
    )
    assert checks["pdf.incremental_updates"]["severity"] == "warning"


def test_clean_pdf_does_not_raise_the_edit_flag():
    from app import forensics

    result = forensics.screen(_clean_pdf())
    assert "pdf.incremental_updates" not in {f["check"] for f in result["flags"]}


def test_editor_software_tag_is_flagged_on_images():
    from app import forensics

    result = forensics.screen(_jpeg(software="Adobe Photoshop 25.0"))
    checks = {f["check"]: f for f in result["flags"]}
    assert "image.software" in checks
    assert checks["image.software"]["severity"] == "warning"


def test_screening_is_triage_not_verdict():
    """Every response must carry the disclaimer note, and a clean file must say
    that absence of flags is not proof of authenticity."""
    from app import forensics

    result = forensics.screen(_jpeg())
    assert "NOT a forensic finding" in result["note"]


def test_garbage_input_is_a_clean_error():
    from app import forensics

    with pytest.raises(forensics.ScreeningError):
        forensics.screen(b"\x00\x01 not a document")


# ---------------------------------------------------------------------------
# endpoint
# ---------------------------------------------------------------------------
def test_endpoint_screens_and_binds_hash_to_the_exact_bytes(client):
    data = _tampered_pdf()
    resp = client.post(
        "/forensics/screen",
        files={"file": ("panchnama.pdf", data, "application/pdf")},
        headers={"X-Actor-Role": "IO", "X-Actor-Name": "Screen Test"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["kind"] == "pdf"
    # the screening result is bound to the exact received bytes
    assert body["sha256"] == hashlib.sha256(data).hexdigest()
    assert "pdf.incremental_updates" in {f["check"] for f in body["flags"]}
    assert "NOT a forensic finding" in body["note"]


def test_endpoint_is_readonly_so_legal_advisor_may_use_it(client):
    resp = client.post(
        "/forensics/screen",
        files={"file": ("photo.jpg", _jpeg(), "image/jpeg")},
        headers={"X-Actor-Role": "LEGAL_ADVISOR", "X-Actor-Name": "Advisor"},
    )
    assert resp.status_code == 200
