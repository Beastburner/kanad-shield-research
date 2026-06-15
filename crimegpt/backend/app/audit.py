"""Append-only audit-log writer. Called from every mutating endpoint.
The DB enforces append-only via triggers; this is the single insert path."""

from typing import Any
from uuid import UUID

from .db import pool


async def record(
    action: str,
    *,
    case_id: UUID | None = None,
    doc_id: UUID | None = None,
    actor: str = "system",
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> None:
    await pool().execute(
        """
        INSERT INTO audit_log (case_id, doc_id, action, actor, before, after)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        case_id,
        doc_id,
        action,
        actor,
        before,  # dict -> jsonb via the connection codec (see db._jsonb_encode)
        after,
    )
