"""Claim 4 — the audit log is append-only.

"Tamper-proof audit trail" is a headline compliance claim, and it is enforced
nowhere in Python: `audit.record()` only ever INSERTs, and the guarantee rests
entirely on three triggers in db/schema.sql. A migration that recreates the
table without them, or a `DROP TRIGGER` during debugging, would silently void
the claim. These tests attack the table directly over a raw connection —
bypassing the API — because that is how a tamperer would.

The UPDATE/DELETE tests need real rows to attack: a row-level BEFORE trigger
does not fire when a statement matches nothing, so they run against the
`case.create` rows the `case` fixture has already produced.
"""

from uuid import UUID

import asyncpg
import pytest

from app.config import settings

from .conftest import H_IO, _purge_case, db_fetch


async def _connect():
    return await asyncpg.connect(settings.database_url)


@pytest.mark.asyncio
async def test_update_on_audit_log_raises(case):
    """Rewriting history — e.g. changing `actor` to blame another officer — must
    be impossible, not merely undocumented."""
    conn = await _connect()
    try:
        existing = await conn.fetch(
            "SELECT id FROM audit_log WHERE case_id = $1", UUID(case)
        )
        assert existing, "case.create wrote no audit row — nothing to protect"

        with pytest.raises(asyncpg.exceptions.RaiseError) as err:
            await conn.execute(
                "UPDATE audit_log SET actor = 'tampered' WHERE case_id = $1", UUID(case)
            )
        assert "append-only" in str(err.value)
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_delete_on_audit_log_raises(case):
    """Erasing an entry is the more likely attack than editing one."""
    conn = await _connect()
    try:
        with pytest.raises(asyncpg.exceptions.RaiseError) as err:
            await conn.execute("DELETE FROM audit_log WHERE case_id = $1", UUID(case))
        assert "append-only" in str(err.value)

        remaining = await conn.fetch(
            "SELECT id FROM audit_log WHERE case_id = $1", UUID(case)
        )
        assert remaining, "rows disappeared despite the trigger raising"
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_insert_on_audit_log_is_still_allowed(case):
    """Guard against over-blocking: a trigger that rejected INSERT too would
    make the whole log stop recording while every test above still passed."""
    conn = await _connect()
    try:
        await conn.execute(
            """INSERT INTO audit_log (case_id, action, actor)
               VALUES ($1, 'test.append_check', 'pytest')""",
            UUID(case),
        )
        actions = [
            r["action"]
            for r in await conn.fetch(
                "SELECT action FROM audit_log WHERE case_id = $1", UUID(case)
            )
        ]
        assert "test.append_check" in actions
    finally:
        await conn.close()


def test_mutating_endpoints_write_audit_rows(client, case):
    """The trigger only protects rows that exist. If an endpoint forgets to call
    `audit.record()`, the trail has a hole and the append-only guarantee is
    worthless for that action."""
    client.post(
        f"/cases/{case}/diary",
        json={"event_type": "raid", "description": "Premises searched."},
        headers=H_IO,
    )
    client.post(f"/cases/{case}/documents", json={"type": "chargesheet"}, headers=H_IO)

    actions = {
        r["action"]
        for r in db_fetch("SELECT action FROM audit_log WHERE case_id = $1", UUID(case))
    }
    assert {"case.create", "diary.add", "document.generate"} <= actions


def test_audit_entries_record_the_actor_and_are_readable_via_the_api(client, case):
    """An unattributed audit row cannot support a chain of custody, and the
    officer-facing endpoint is where a judge would look."""
    entries = client.get(f"/cases/{case}/audit").json()
    creation = [e for e in entries if e["action"] == "case.create"]
    assert creation, entries
    assert creation[0]["actor"] == "Test IO (Investigating Officer)"
    assert creation[0]["after"]["case_number"].startswith("TEST-")


def test_audit_rows_outlive_the_case_they_describe(client, case_factory):
    """Deleting a case must not take its audit trail with it — otherwise the
    trail is erasable in one step, trigger or no trigger."""
    case_id = case_factory(analyzed=False)
    before = db_fetch("SELECT id FROM audit_log WHERE case_id = $1", UUID(case_id))
    assert before

    _purge_case(case_id)

    assert client.get(f"/cases/{case_id}").status_code == 404
    after = db_fetch("SELECT id FROM audit_log WHERE case_id = $1", UUID(case_id))
    assert len(after) == len(before)
