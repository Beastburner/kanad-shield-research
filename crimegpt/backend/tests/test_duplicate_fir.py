"""Duplicate-FIR guard on POST /cases.

The failure this prevents: the same physical FIR scanned/registered twice creates
two parallel case files for one incident. OCR is not byte-stable between passes
of the same page, so the guard must catch near-duplicates, not just re-pastes —
while never blocking a genuinely different narrative, and always leaving the
officer a deliberate override (force=true)."""

from uuid import uuid4

H_IO = {"X-Actor-Role": "IO", "X-Actor-Name": "Dup Test"}

NARRATIVE = (
    "S.P.E.C-II FIRST INFORMATION REPORT (Under Sec. 173 BNSS) Book No. Year-2026 "
    "Serial No. 05 1. District P.S. Yamuna Nagar. The complainant Suresh Kumar "
    "reported that his motorcycle bearing registration HR-02-AB-4321 was stolen "
    "from outside the district court complex between 2 PM and 4 PM."
)


def _create(client, narrative, force=False):
    return client.post(
        "/cases",
        json={"case_number": f"TEST-{uuid4().hex[:8]}",
              "fir_narrative": narrative, "force": force},
        headers=H_IO,
    )


def test_exact_duplicate_is_rejected_with_the_existing_case(client, purge):
    first = _create(client, NARRATIVE)
    assert first.status_code == 201
    purge(first.json()["id"])

    second = _create(client, NARRATIVE)
    assert second.status_code == 409
    detail = second.json()["detail"]
    assert detail["code"] == "duplicate_fir"
    assert detail["existing_case_id"] == first.json()["id"]
    assert detail["similarity"] == 1.0


def test_rescan_with_ocr_noise_is_still_caught(client, purge):
    """The same page OCR'd twice: different line breaks, a few misread
    characters. Must still resolve to the existing case."""
    first = _create(client, NARRATIVE)
    assert first.status_code == 201
    purge(first.json()["id"])

    noisy = NARRATIVE.replace("Suresh", "5uresh").replace("between", "betueen")
    noisy = noisy.replace(". ", ".\n")  # OCR line-break variance
    second = _create(client, noisy)
    assert second.status_code == 409
    detail = second.json()["detail"]
    assert detail["existing_case_id"] == first.json()["id"]
    assert detail["similarity"] < 1.0  # matched by the fuzzy tier, not exact


def test_a_different_incident_is_not_blocked(client, purge):
    first = _create(client, NARRATIVE)
    assert first.status_code == 201
    purge(first.json()["id"])

    other = (
        "The complainant Meena Shah states that on 15 August 2026 an unknown "
        "person snatched her gold chain near Law Garden while she was walking "
        "home in the evening. Two witnesses saw a red scooter leaving the spot."
    )
    second = _create(client, other)
    assert second.status_code == 201
    purge(second.json()["id"])


def test_force_lets_the_officer_reregister_deliberately(client, purge):
    first = _create(client, NARRATIVE)
    assert first.status_code == 201
    purge(first.json()["id"])

    forced = _create(client, NARRATIVE, force=True)
    assert forced.status_code == 201
    purge(forced.json()["id"])
