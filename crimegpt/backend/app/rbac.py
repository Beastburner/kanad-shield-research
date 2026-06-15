"""Role-based access control (P4) — IO / SHO / Legal Advisor.

Lightweight, header-driven (no auth server for the hackathon): the frontend sends
the signed-in officer's role and name as `X-Actor-Role` / `X-Actor-Name`. The
`actor` string flows into the append-only audit log and the case diary, so every
mutation is attributable. `require()` gates an endpoint to a set of roles.

Permission model (least privilege):
  - IO  (Investigating Officer): full investigative workflow.
  - SHO (Station House Officer):  everything (supervisory).
  - LEGAL_ADVISOR:               read + legal analysis only; no filings/edits.
"""

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException

from .models import Role

_VALID = {"IO", "SHO", "LEGAL_ADVISOR"}
_LABEL = {"IO": "Investigating Officer", "SHO": "Station House Officer",
          "LEGAL_ADVISOR": "Legal Advisor"}


@dataclass
class Actor:
    role: str
    name: str

    def __str__(self) -> str:
        # what gets written to audit_log.actor / case_diary.actor
        return f"{self.name} ({_LABEL.get(self.role, self.role)})"


def current_actor(
    x_actor_role: str = Header(default="IO"),
    x_actor_name: str = Header(default="Officer"),
) -> Actor:
    role = x_actor_role.upper().strip()
    if role not in _VALID:
        role = "IO"
    return Actor(role=role, name=x_actor_name.strip() or "Officer")


def require(*allowed: Role):
    """FastAPI dependency: resolves the actor, then 403s unless the role is allowed."""
    allowed_set = set(allowed)

    def dependency(actor: Actor = Depends(current_actor)) -> Actor:
        if actor.role not in allowed_set:
            raise HTTPException(
                403,
                f"{_LABEL.get(actor.role, actor.role)} is not permitted to perform "
                f"this action (requires: {', '.join(sorted(allowed_set))}).",
            )
        return actor

    return dependency
