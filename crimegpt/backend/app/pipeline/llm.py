"""Groq + LLaMA-3.3-70B client with JSON-mode output.

Groq's chat completions support response_format={"type": "json_object"}, so we
force valid JSON and validate it against a Pydantic model. If GROQ_API_KEY is
unset we raise a clear error rather than silently returning garbage."""

import asyncio
import json
import re
from typing import Any, Type, TypeVar

from groq import AsyncGroq
from pydantic import BaseModel, ValidationError

from ..config import settings

T = TypeVar("T", bound=BaseModel)

_client: AsyncGroq | None = None

# Retry transient (per-minute) rate limits, but never block on the daily-cap 429
# (those report "try again in ~Nm") — re-raise so callers fall back gracefully.
_MAX_RETRIES = 2
_MAX_WAIT_S = 12.0


def client() -> AsyncGroq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to .env to run the pipeline."
            )
        # max_retries=0: we own the retry policy below.
        _client = AsyncGroq(api_key=settings.groq_api_key, max_retries=0)
    return _client


def _rate_limit_wait(e: Exception) -> float | None:
    """If `e` is a 429 rate-limit error, return the suggested wait in seconds;
    otherwise None (not a rate limit)."""
    s = str(e)
    if "429" not in s and "rate_limit" not in s.lower():
        return None
    m = re.search(r"try again in (?:(\d+)m)?\s*([\d.]+)s", s)
    if m:
        return int(m.group(1) or 0) * 60 + float(m.group(2) or 0)
    return 1.0  # unparseable -> short default


async def _create(**kwargs: Any):
    """chat.completions.create with bounded retry on short rate limits."""
    for attempt in range(_MAX_RETRIES + 1):
        try:
            return await client().chat.completions.create(**kwargs)
        except Exception as e:
            wait = _rate_limit_wait(e)
            if wait is not None and wait <= _MAX_WAIT_S and attempt < _MAX_RETRIES:
                await asyncio.sleep(wait + 0.5)
                continue
            raise


async def complete_json(system: str, user: str, schema: Type[T]) -> T:
    """Call the LLM in JSON mode and parse into `schema`.

    The JSON schema of `schema` is injected into the system prompt so the model
    knows the exact shape to emit — this is the anti-free-form-garbage guard.
    """
    schema_json = json.dumps(schema.model_json_schema())
    system_full = (
        f"{system}\n\n"
        "Respond with a SINGLE JSON object that strictly conforms to this "
        f"JSON Schema. Do not add commentary or markdown fences:\n{schema_json}"
    )

    resp = await _create(
        model=settings.groq_model,
        temperature=0,   # deterministic: borderline cases shouldn't flip across the
                         # confidence threshold on re-run (same FIR -> same verdict)
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_full},
            {"role": "user", "content": user},
        ],
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        return schema.model_validate_json(raw)
    except ValidationError as e:
        raise RuntimeError(f"LLM returned JSON that failed schema validation: {e}")


async def complete_text(system: str, user: str) -> str:
    """Plain-text completion (used for translation)."""
    resp = await _create(
        model=settings.groq_model,
        temperature=0.1,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (resp.choices[0].message.content or "").strip()
