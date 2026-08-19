"""LLM client with JSON-mode output and a second provider for failover.

Primary is Groq (model from GROQ_MODEL) — chosen for latency, which matters during
a live demo. Its free tier is 200,000 tokens/day, though, and exhausting it used to
drop the whole pipeline to keyword matching with no fact extraction. So when Groq
reports a quota it cannot serve within `_MAX_WAIT_S`, the same call is retried
against NVIDIA NIM (`NVIDIA_API_KEY`), which is OpenAI-compatible. Without that key
set, behaviour is exactly as before.

Both providers are asked for `response_format={"type":"json_object"}`. The required
JSON Schema is ALSO injected into the system prompt, so if a provider rejects the
parameter the call is retried without it and the response still parses — the schema
instruction is what actually constrains the shape.
"""

import asyncio
import json
import re
from typing import Type, TypeVar

import httpx
from groq import APIConnectionError, APITimeoutError, AsyncGroq
from pydantic import BaseModel, ValidationError

from ..config import settings

T = TypeVar("T", bound=BaseModel)

_client: AsyncGroq | None = None

# Retry transient (per-minute) rate limits, but never block on the daily-cap 429
# (those report "try again in ~Nm") — hand those to the fallback provider instead.
_MAX_RETRIES = 2
# Groq's free tier is 8k tokens/minute; a three-stage analysis of a long FIR can
# exhaust it and come back "try again in ~12.3s". A 12s ceiling re-raised on those
# by a fraction of a second and 500'd the request — 25s absorbs a full TPM window.
_MAX_WAIT_S = 25.0

# Latched once a provider rejects response_format, so we stop paying for a failed
# round-trip on every subsequent call.
_no_json_mode: set[str] = set()

# Same latch for reasoning_effort (gpt-oss on Groq accepts it; a different
# GROQ_MODEL might 400 on it, and that must degrade, not fail the pipeline).
_no_reasoning_effort: set[str] = set()


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


def _is_transient(e: Exception) -> bool:
    """A dropped connection or read timeout on the way to the provider. Worth one
    more try — venue wifi blips should not surface as a failed analysis."""
    return isinstance(e, (APIConnectionError, APITimeoutError,
                          httpx.ConnectError, httpx.ReadError, httpx.ReadTimeout))


def _rejects_json_mode(status: int, body: str) -> bool:
    """Whether a 400 is specifically about the response_format parameter."""
    return status == 400 and "response_format" in body


async def _groq_chat(system: str, user: str, *, json_mode: bool,
                     temperature: float, reasoning_effort: str | None = None,
                     max_tokens: int | None = None) -> str:
    """Primary provider. Raises on quota exhaustion so the caller can fail over."""
    regenerated = False   # one-shot guard for json_validate_failed regeneration
    for attempt in range(_MAX_RETRIES + 1):
        kwargs = {
            "model": settings.groq_model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if json_mode and "groq" not in _no_json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if reasoning_effort is not None and "groq" not in _no_reasoning_effort:
            # groq SDK 0.9.0 has no named param for this; extra_body merges it
            # into the request JSON, which the API accepts for gpt-oss models.
            kwargs["extra_body"] = {"reasoning_effort": reasoning_effort}
        try:
            resp = await client().chat.completions.create(**kwargs)
            return resp.choices[0].message.content or ""
        except Exception as e:
            if _rejects_json_mode(getattr(e, "status_code", 0), str(e)):
                _no_json_mode.add("groq")
                continue
            # json_validate_failed is checked BEFORE the reasoning_effort latch:
            # its 400 body embeds the failed generation, and if that text happened
            # to contain the literal "reasoning_effort" the broad substring latch
            # below would permanently disable the parameter.
            if (getattr(e, "status_code", 0) == 400
                    and "json_validate_failed" in str(e)
                    and not regenerated):
                # The model emitted malformed JSON once (observed: "0. nine" for
                # 0.9) and Groq's json mode 400'd. Generation isn't bit-identical
                # even at temperature 0, so one regeneration usually parses —
                # without it this single glitch dumps the whole analysis to the
                # keyword fallback. True one-shot: the flag, not the attempt
                # counter, bounds it.
                regenerated = True
                print("[llm] groq json_validate_failed; regenerating once")
                continue
            if getattr(e, "status_code", 0) == 400 and "reasoning_effort" in str(e):
                _no_reasoning_effort.add("groq")
                continue
            wait = _rate_limit_wait(e)
            if wait is not None and wait <= _MAX_WAIT_S and attempt < _MAX_RETRIES:
                await asyncio.sleep(wait + 0.5)
                continue
            if _is_transient(e) and attempt < _MAX_RETRIES:
                await asyncio.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise RuntimeError("groq: retries exhausted")


async def _nvidia_chat(system: str, user: str, *, json_mode: bool,
                       temperature: float) -> str:
    """Fallback provider (NVIDIA NIM, OpenAI-compatible). Plain httpx — no extra
    dependency, and the payload shape is identical to Groq's."""
    payload = {
        "model": settings.nvidia_model,
        "temperature": temperature,
        "max_tokens": 4096,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    if json_mode and "nvidia" not in _no_json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {"Authorization": f"Bearer {settings.nvidia_api_key}",
               "Accept": "application/json"}
    url = f"{settings.nvidia_base_url.rstrip('/')}/chat/completions"

    async with httpx.AsyncClient(timeout=90.0) as http:
        for attempt in range(2):
            resp = await http.post(url, json=payload, headers=headers)
            if _rejects_json_mode(resp.status_code, resp.text):
                # Model doesn't accept the parameter. The schema is already in the
                # system prompt, so drop it and let that do the constraining.
                print("[llm] nvidia rejected response_format; using prompt-only JSON")
                _no_json_mode.add("nvidia")
                payload.pop("response_format", None)
                continue
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"] or ""
    raise RuntimeError("nvidia: retries exhausted")


async def _chat(system: str, user: str, *, json_mode: bool,
                temperature: float, reasoning_effort: str | None = None,
                max_tokens: int | None = None) -> str:
    """Groq, falling over to NVIDIA when Groq cannot serve the call at all.

    reasoning_effort / max_tokens are Groq-only tuning: the NVIDIA fallback model
    (llama, no reasoning tokens) would reject the former and already carries its
    own 4096 output cap."""
    try:
        return await _groq_chat(system, user, json_mode=json_mode,
                                temperature=temperature,
                                reasoning_effort=reasoning_effort,
                                max_tokens=max_tokens)
    except Exception as e:
        if not settings.nvidia_api_key:
            raise
        # Fail over on a quota/rate limit we can't wait out, or on a provider
        # outage. A schema-validation problem is NOT a provider problem, so it is
        # not retried here.
        wait = _rate_limit_wait(e)
        if wait is None and not _is_transient(e):
            raise
        print(f"[llm] groq unavailable ({str(e)[:90]}…); failing over to NVIDIA "
              f"{settings.nvidia_model}")
        return await _nvidia_chat(system, user, json_mode=json_mode,
                                  temperature=temperature)


def _strip_fences(raw: str) -> str:
    """A provider without JSON mode may still wrap output in ```json fences."""
    m = re.search(r"```(?:json)?\s*(.*?)```", raw, re.S)
    return (m.group(1) if m else raw).strip()


async def complete_json(system: str, user: str, schema: Type[T], *,
                        reasoning_effort: str | None = None,
                        max_tokens: int | None = None) -> T:
    """Call the LLM in JSON mode and parse into `schema`.

    The JSON schema of `schema` is injected into the system prompt so the model
    knows the exact shape to emit — this is the anti-free-form-garbage guard, and
    the reason a provider without a response_format parameter still works.

    `reasoning_effort` ("low"/"medium"/"high", Groq gpt-oss only) and `max_tokens`
    let latency-critical structured calls cap the reasoning/output token spend —
    on the free tier fewer tokens is also fewer TPM-limit sleeps. None = provider
    defaults (unchanged behaviour for existing callers).
    """
    schema_json = json.dumps(schema.model_json_schema())
    system_full = (
        f"{system}\n\n"
        "Respond with a SINGLE JSON object that strictly conforms to this "
        f"JSON Schema. Do not add commentary or markdown fences:\n{schema_json}"
    )

    raw = await _chat(
        system_full, user,
        json_mode=True,
        # deterministic: borderline cases shouldn't flip across the confidence
        # threshold on re-run (same FIR -> same verdict)
        temperature=0,
        reasoning_effort=reasoning_effort,
        max_tokens=max_tokens,
    )
    try:
        return schema.model_validate_json(_strip_fences(raw) or "{}")
    except ValidationError as e:
        raise RuntimeError(f"LLM returned JSON that failed schema validation: {e}")


async def complete_text(system: str, user: str) -> str:
    """Plain-text completion (used for translation)."""
    raw = await _chat(system, user, json_mode=False, temperature=0.1)
    return raw.strip()
