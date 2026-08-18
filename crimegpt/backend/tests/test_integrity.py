"""Claim 2 — evidence integrity: SHA-256, BSA s.63 certificate, versioning.

The legally load-bearing claim is not "we store a hash" but "the stored hash is
the hash of the bytes the court will receive". So these tests recompute the
digest from disk with an independent hashlib call and compare, rather than
trusting `integrity.sha256_file` to agree with itself.

Versioning matters for the same reason: a regenerated chargesheet must not
silently replace the one already referenced elsewhere.
"""

import hashlib
from pathlib import Path
from uuid import UUID

from docx import Document as Docx

from .conftest import H_IO, db_fetch


def _sha256_of(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def test_recorded_hash_matches_the_bytes_on_disk(client, case):
    """If the recorded digest and the delivered file ever diverge, every s.63
    certificate the system has issued is false. Recompute and compare."""
    body = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO
    ).json()

    assert _sha256_of(body["file_path"]) == body["sha256"]


def test_hash_stored_in_the_database_matches_disk(client, case):
    """The API response is generated in-process; the row is what an audit would
    actually be checked against. Verify the persisted value too."""
    body = client.post(
        f"/cases/{case}/documents", json={"type": "seizure_receipt"}, headers=H_IO
    ).json()

    row = db_fetch(
        "SELECT file_path, sha256 FROM documents WHERE id = $1", UUID(body["id"])
    )[0]
    assert row["sha256"] == _sha256_of(row["file_path"])


def test_s63_certificate_is_generated_and_carries_the_hash(client, case):
    """A BSA s.63 certificate without the digest of the record it certifies
    proves nothing — the hash must actually appear in the certificate text."""
    body = client.post(
        f"/cases/{case}/documents", json={"type": "remand_request"}, headers=H_IO
    ).json()

    cert_path = body["s63_cert_path"]
    assert Path(cert_path).is_file()

    text = "\n".join(p.text for p in Docx(cert_path).paragraphs)
    table_text = "\n".join(
        cell.text
        for table in Docx(cert_path).tables
        for row in table.rows
        for cell in row.cells
    )
    assert "SECTION 63" in text.upper()
    assert body["sha256"] in table_text


def test_regenerating_a_type_creates_version_2_and_supersedes_version_1(client, case):
    """Version history is the tamper-evidence story for documents: the first
    draft must survive, marked superseded, not be overwritten in place."""
    first = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO
    ).json()
    second = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO
    ).json()

    assert first["version"] == 1
    assert second["version"] == 2
    assert first["file_path"] != second["file_path"]

    by_id = {d["id"]: d for d in client.get(f"/cases/{case}/documents").json()}
    assert by_id[first["id"]]["superseded"] is True
    assert by_id[second["id"]]["superseded"] is False
    # The superseded draft must still be on disk and still match its own hash.
    assert _sha256_of(first["file_path"]) == first["sha256"]


def test_versions_are_numbered_per_document_type(client, case):
    """Generating a different type must not inherit another type's version
    counter, or the numbering an officer cites in court is wrong."""
    client.post(f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO)
    client.post(f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO)
    other = client.post(
        f"/cases/{case}/documents", json={"type": "lers_request"}, headers=H_IO
    ).json()

    assert other["version"] == 1
    assert other["superseded"] is False
