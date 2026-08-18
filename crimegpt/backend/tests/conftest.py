"""Shared fixtures for the CrimeGPT test-suite.

These tests run against the SAME Postgres the app uses (docker container
`crimegpt-db`), because two of the four claims under test — the append-only
audit triggers and document version history — are enforced by the database, not
by Python. Mocking the DB would test nothing that a judge cares about.

The LLM is never called. `POST /cases/{id}/analyze` is deliberately absent from
the whole suite: Groq's free tier is 200k tokens/day and a test run must not
compete with the demo for it. Document generation is pure templating, so the
analyzed state it depends on (`case_facts` + `suggested_sections`) is seeded
with direct INSERTs instead.

Every case created here is prefixed `TEST-` and deleted at teardown. Its
`audit_log` rows survive — the append-only trigger blocks DELETE, which is the
behaviour claim 4 asserts, so leftovers there are expected and correct.
"""

import asyncio
import json
from pathlib import Path
from uuid import UUID, uuid4

import asyncpg
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

# Role headers consumed by app.rbac.current_actor.
H_IO = {"X-Actor-Role": "IO", "X-Actor-Name": "Test IO"}
H_SHO = {"X-Actor-Role": "SHO", "X-Actor-Name": "Test SHO"}
H_LEGAL = {"X-Actor-Role": "LEGAL_ADVISOR", "X-Actor-Name": "Test Advisor"}

FIR_NARRATIVE = (
    "On 12 June 2026 two unknown persons broke the lock of the complainant "
    "Ramesh Patel's shop in Ahmedabad and stole a laptop and Rs 45000 in cash. "
    "CCTV footage of the incident is available."
)

# Stand-in for what the extraction agent would produce. Hand-written so the
# suite never needs the LLM, and stable so document assertions stay meaningful.
SEED_FACTS = {
    "complainant": "Ramesh Patel",
    "accused": ["Unknown Person A", "Unknown Person B"],
    "victims": ["Ramesh Patel"],
    "items": ["Dell laptop", "Cash Rs 45000"],
    "events": [
        "The lock of the complainant's shop was broken during the night.",
        "A laptop and cash were removed from the premises.",
    ],
    "location": "Ahmedabad",
    "dates": ["12-06-2026"],
}

SEED_SECTIONS = [
    ("BNS", "305", "Theft in a dwelling house or means of transport", "IPC 380", 0.91),
    ("BNS", "331(3)", "House-breaking in order to commit an offence", "IPC 454", 0.84),
]


# ---------------------------------------------------------------------------
# raw DB access — a fresh connection per call, deliberately outside the app's
# pool so a test can never be fooled by application-side caching or by the
# pool's event loop (the TestClient runs the app loop in another thread).
# ---------------------------------------------------------------------------
def db_execute(query: str, *args):
    async def _go():
        conn = await asyncpg.connect(settings.database_url)
        try:
            return await conn.execute(query, *args)
        finally:
            await conn.close()

    return asyncio.run(_go())


def db_fetch(query: str, *args):
    async def _go():
        conn = await asyncpg.connect(settings.database_url)
        try:
            return await conn.fetch(query, *args)
        finally:
            await conn.close()

    return asyncio.run(_go())


def _seed_analysis(case_id: str) -> None:
    db_execute(
        """INSERT INTO case_facts (case_id, facts, source)
           VALUES ($1, $2::jsonb, 'test_seed')
           ON CONFLICT (case_id) DO UPDATE SET facts = $2::jsonb""",
        UUID(case_id), json.dumps(SEED_FACTS),
    )
    for code, section_no, heading, old_ref, confidence in SEED_SECTIONS:
        db_execute(
            """INSERT INTO suggested_sections
               (case_id, code, section_no, heading, old_code_ref, confidence, validated)
               VALUES ($1,$2,$3,$4,$5,$6,true)""",
            UUID(case_id), code, section_no, heading, old_ref, confidence,
        )


def _purge_case(case_id: str) -> None:
    """Delete a test case, its cascaded rows and the .docx files it produced.

    `audit_log` rows are intentionally left behind: the DB trigger rejects
    DELETE on that table, which is exactly the guarantee under test.
    """
    for row in db_fetch(
        "SELECT file_path, s63_cert_path FROM documents WHERE case_id = $1",
        UUID(case_id),
    ):
        for path in (row["file_path"], row["s63_cert_path"]):
            if path:
                Path(path).unlink(missing_ok=True)
    db_execute("DELETE FROM cases WHERE id = $1", UUID(case_id))


# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def client():
    """TestClient inside a `with` block so FastAPI's lifespan runs and the
    asyncpg pool is initialised — without it every endpoint 500s."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def purge():
    """Register case ids a test creates itself, so they are cleaned up even
    when the test asserts on the creation call rather than using `case`."""
    ids: list[str] = []
    yield ids.append
    for case_id in ids:
        _purge_case(case_id)


@pytest.fixture
def case_factory(client, purge):
    def _make(analyzed: bool = True) -> str:
        response = client.post(
            "/cases",
            json={"case_number": f"TEST-{uuid4().hex[:8]}", "fir_narrative": FIR_NARRATIVE},
            headers=H_IO,
        )
        assert response.status_code == 201, response.text
        case_id = response.json()["id"]
        purge(case_id)
        if analyzed:
            _seed_analysis(case_id)
        return case_id

    return _make


@pytest.fixture
def case(case_factory) -> str:
    """A TEST- case that already has facts + sections, i.e. the state document
    generation requires, reached without spending LLM quota."""
    return case_factory()
