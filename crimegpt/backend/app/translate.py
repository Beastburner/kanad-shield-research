"""Multilingual I/O layer (PS functional requirement: Gujarati / Hindi / English).

Translation uses the same Groq LLM, so there is no extra dependency. The FIR
narrative may also be submitted directly in Hindi/Gujarati — the extraction agent
handles multilingual input natively; this module is for translating UI text and
generated output back to the officer's language."""

from .pipeline import llm

LANGS = {"en": "English", "hi": "Hindi", "gu": "Gujarati"}


async def translate(text: str, target: str, source: str = "auto") -> str:
    if target not in LANGS:
        raise ValueError(f"unsupported target language: {target}")
    if not text.strip():
        return text
    src = LANGS.get(source, "the source language")
    system = (
        f"You are a precise legal translator. Translate the user's text from {src} "
        f"into {LANGS[target]}. Preserve legal section numbers (e.g. BNS 303), "
        "names, dates and numbers exactly. Output ONLY the translation, no notes."
    )
    return await llm.complete_text(system, text)
