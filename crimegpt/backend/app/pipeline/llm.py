"""Groq + LLaMA-3.3-70B client with JSON-mode output.

Groq's chat completions support response_format={"type": "json_object"}, so we
force valid JSON and validate it against a Pydantic model. If GROQ_API_KEY is
unset we raise a clear error rather than silently returning garbage."""

import json
from typing import Type, TypeVar

from groq import AsyncGroq
from pydantic import BaseModel, ValidationError

from ..config import settings

T = TypeVar("T", bound=BaseModel)

_client: AsyncGroq | None = None


def client() -> AsyncGroq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to .env to run the pipeline."
            )
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


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

    resp = await client().chat.completions.create(
        model=settings.groq_model,
        temperature=0.1,
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
    resp = await client().chat.completions.create(
        model=settings.groq_model,
        temperature=0.1,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (resp.choices[0].message.content or "").strip()
