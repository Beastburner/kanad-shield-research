"""Check both LLM providers, and specifically whether each supports JSON mode.

Run after setting NVIDIA_API_KEY, BEFORE relying on the failover in a demo:

    python -m scripts.check_providers

The whole pipeline is built on `llm.complete_json`, so a provider that cannot
return a parseable JSON object is not a usable fallback. This tests exactly that,
for a couple of hundred tokens, rather than finding out mid-demo.
"""

import asyncio
import sys

import httpx
from pydantic import BaseModel

from app.config import settings


class _Probe(BaseModel):
    """Tiny schema — same mechanism the pipeline uses, minimal token cost."""

    offence: str
    section: str


SYSTEM = ("You are a legal classification agent. Reply with the BNS section for the "
          "offence described.")
USER = "A man picked up and rode away someone else's parked motorcycle."


async def _probe_openai_compatible(name: str, base_url: str, key: str,
                                   model: str) -> None:
    if not key:
        print(f"[{name}] no API key configured — skipped")
        return

    schema = _Probe.model_json_schema()
    system = (f"{SYSTEM}\n\nRespond with a SINGLE JSON object conforming to this "
              f"JSON Schema, no commentary or fences:\n{schema}")
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 512,
        "messages": [{"role": "system", "content": system},
                     {"role": "user", "content": USER}],
        "response_format": {"type": "json_object"},
    }
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=90.0) as http:
        for label in ("with response_format", "without response_format"):
            try:
                r = await http.post(url, json=payload, headers=headers)
            except Exception as e:
                print(f"[{name}] {model}: UNREACHABLE — {e}")
                return
            if r.status_code == 400 and "response_format" in r.text:
                print(f"[{name}] {model}: rejects response_format — "
                      f"retrying prompt-only (this is handled automatically)")
                payload.pop("response_format", None)
                continue
            if r.status_code != 200:
                print(f"[{name}] {model}: HTTP {r.status_code} — {r.text[:160]}")
                return

            content = r.json()["choices"][0]["message"]["content"] or ""
            try:
                parsed = _Probe.model_validate_json(content.strip())
            except Exception:
                print(f"[{name}] {model}: OK ({label}) but output did NOT parse "
                      f"as JSON — NOT usable for the pipeline.\n"
                      f"          got: {content[:120]!r}")
                return
            usage = r.json().get("usage", {})
            print(f"[{name}] {model}: OK ({label}) — parsed "
                  f"{parsed.offence}/{parsed.section}, "
                  f"{usage.get('total_tokens','?')} tokens")
            return


async def main() -> int:
    print("Probing providers with a JSON-mode request…\n")
    await _probe_openai_compatible(
        "groq", "https://api.groq.com/openai/v1",
        settings.groq_api_key, settings.groq_model)
    await _probe_openai_compatible(
        "nvidia", settings.nvidia_base_url,
        settings.nvidia_api_key, settings.nvidia_model)

    if not settings.nvidia_api_key:
        print("\nNo NVIDIA failover configured. Groq's free tier is 200k tokens/day;\n"
              "when it runs out the pipeline drops to the curated keyword mapping and\n"
              "extracts no facts. Set NVIDIA_API_KEY from https://build.nvidia.com.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
