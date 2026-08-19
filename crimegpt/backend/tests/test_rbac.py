"""Claim 3 — role-based access control (IO / SHO / Legal Advisor).

The permission model is least-privilege: the Legal Advisor advises, they do not
file. That claim is made to police officers, who will assume a wrong role can
never author a document that carries their station's letterhead. RBAC is a
single `Depends` per endpoint, so it is trivially easy to omit on a new
endpoint — these tests pin the three write endpoints named in the pitch and
confirm reads stay open to everyone.
"""

from uuid import uuid4

import pytest

from .conftest import FIR_NARRATIVE, H_IO, H_LEGAL, H_SHO


def _new_case_payload() -> dict:
    # force=True for the same reason as conftest's factory: shared narrative,
    # and RBAC tests are about roles, not duplicate detection.
    return {"case_number": f"TEST-{uuid4().hex[:8]}",
            "fir_narrative": FIR_NARRATIVE, "force": True}


# ---------------------------------------------------------------------------
# denied
# ---------------------------------------------------------------------------
def test_legal_advisor_cannot_create_a_case(client):
    response = client.post("/cases", json=_new_case_payload(), headers=H_LEGAL)
    assert response.status_code == 403


def test_legal_advisor_cannot_add_a_diary_entry(client, case):
    response = client.post(
        f"/cases/{case}/diary",
        json={"description": "Attempted entry by legal advisor."},
        headers=H_LEGAL,
    )
    assert response.status_code == 403


def test_legal_advisor_cannot_generate_a_document(client, case):
    """The strongest of the three: a document carries a SHA-256 and an s.63
    certificate, i.e. it is evidence. Only investigating roles may mint one."""
    response = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_LEGAL
    )
    assert response.status_code == 403


def test_denial_names_the_role_and_the_requirement(client, case):
    """A bare 403 in a police station is a support call. The message must say
    who was refused and what role is needed."""
    detail = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_LEGAL
    ).json()["detail"]
    assert "Legal Advisor" in detail
    assert "IO" in detail and "SHO" in detail


# ---------------------------------------------------------------------------
# allowed
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("headers", [H_IO, H_SHO], ids=["IO", "SHO"])
def test_investigating_roles_can_create_a_case(client, purge, headers):
    response = client.post("/cases", json=_new_case_payload(), headers=headers)
    assert response.status_code == 201, response.text
    purge(response.json()["id"])


@pytest.mark.parametrize("headers", [H_IO, H_SHO], ids=["IO", "SHO"])
def test_investigating_roles_can_add_a_diary_entry(client, case, headers):
    response = client.post(
        f"/cases/{case}/diary",
        json={"event_type": "witness_interview", "description": "Statement recorded."},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    # The role label is attributed in the entry, which is what makes the diary
    # usable as a chain-of-custody record.
    assert response.json()["actor"] == headers["X-Actor-Name"] + (
        " (Investigating Officer)" if headers is H_IO else " (Station House Officer)"
    )


@pytest.mark.parametrize("headers", [H_IO, H_SHO], ids=["IO", "SHO"])
def test_investigating_roles_can_generate_a_document(client, case, headers):
    response = client.post(
        f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=headers
    )
    assert response.status_code == 201, response.text


# ---------------------------------------------------------------------------
# reads are open to all three roles
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("headers", [H_IO, H_SHO, H_LEGAL], ids=["IO", "SHO", "LEGAL"])
def test_all_roles_can_read(client, case, headers):
    """The Legal Advisor's whole purpose is reading the file, so read paths must
    not be gated — including the audit trail they would review."""
    for path in (
        f"/cases/{case}",
        f"/cases/{case}/diary",
        f"/cases/{case}/documents",
        f"/cases/{case}/audit",
        "/cases",
    ):
        assert client.get(path, headers=headers).status_code == 200, path


# ---------------------------------------------------------------------------
# Unrecognised roles must fail CLOSED.
#
# Regression test for a real escalation bug: current_actor() used to rewrite any
# role it did not recognise to "IO", so a mistyped header ("LEGAL-ADVISOR" with a
# hyphen) silently granted a read-only Legal Advisor full write access. The
# least-privilege model is a scored compliance claim, so this must stay closed.
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("bogus_role", [
    "LEGAL-ADVISOR",   # the realistic one: hyphen instead of underscore
    "PUBLIC",
    "ADMIN",
    "io ",             # trailing space is fine (stripped) -- included as control
])
def test_unrecognised_role_is_rejected_on_write(client, purge, bogus_role):
    resp = client.post(
        "/cases",
        json={"case_number": f"TEST-{uuid4().hex[:8]}",
              "fir_narrative": "A narrative long enough to pass validation."},
        headers={"X-Actor-Role": bogus_role, "X-Actor-Name": "Typo"},
    )
    if bogus_role.strip().upper() in {"IO", "SHO", "LEGAL_ADVISOR"}:
        assert resp.status_code != 403          # control: valid role, just untidy
        purge(resp.json()["id"])
    else:
        assert resp.status_code == 403, (
            f"role {bogus_role!r} was accepted -- unknown roles must not be "
            f"silently upgraded to IO"
        )
        assert "nrecognised" in resp.json()["detail"]


def test_absent_role_header_still_defaults_to_io(client, purge):
    """No header at all is the documented no-auth-server default, not an error.
    Only a header that is present and wrong is rejected."""
    resp = client.post(
        "/cases",
        json={"case_number": f"TEST-{uuid4().hex[:8]}",
              "fir_narrative": "A narrative long enough to pass validation."},
    )
    assert resp.status_code == 201
    purge(resp.json()["id"])
