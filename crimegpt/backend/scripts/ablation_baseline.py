"""Ablation experiment: unconstrained LLM vs. the CrimeGPT pipeline.

WHY THIS EXISTS
A claim like "our pipeline prevents hallucinated law" is untestable unless you
measure the thing it is compared against. This script establishes the baseline:
the SAME model (GROQ_MODEL) answering the SAME narratives with NO retrieval, NO
chunk-id constraint and NO validation stage — i.e. what a team gets by simply
asking an LLM for the sections.

WHAT IS MEASURED (all three are objectively checkable, not judgement calls):
  1. Repealed-code citation — does it name IPC/CrPC sections as the CHARGE?
     Post 1 July 2024 that is simply wrong law.
  2. Section correctness — does the primary BNS section match the known-correct
     answer for that offence (from test-scenarios.md, cross-checked against the
     official concordance)?
  3. Case-law INTERNAL CONSISTENCY — not existence. We deliberately do NOT
     claim to verify whether a cited judgment is real: party names like
     "Mohan Lal vs State of Punjab" are extremely common in Indian case law, so
     a name hit in a search index proves nothing, and a miss proves nothing
     either (we confirmed both failure directions empirically — the real
     landmark "Bachan Singh v. State of Punjab" did not surface by name search).
     Verifying an AIR/SCC citation needs a citator database we do not have.
     What IS provable from the baseline's own output: when it cites the SAME
     party names with DIFFERENT reporter citations across cases, at most one can
     be correct. That is self-contradiction, demonstrable without any external
     source. (Our pipeline cannot exhibit this failure at all: it has no
     generation step in the judgment path — it only returns search results.)

The comparison figures for the pipeline arm come from scripts/run_scenarios.py,
which is the pre-registered 13-scenario gate; this script does not re-run the
pipeline, so it stays cheap (one LLM call per narrative).

    python -m scripts.ablation_baseline            # ~6 calls, prints a table

Limitations, stated because a research claim needs them: n=6 narratives, one
model, one run per narrative (the model is not deterministic, so single-run
results are indicative of failure MODES, not precise rates). Its purpose is to
show the failure modes the architecture removes, not to publish a rate.
"""

import asyncio
import json
import re
import sys

from app.config import settings
from app.pipeline import llm, retrieval
from app.db import init_pool, close_pool
from pydantic import BaseModel


class _BaselineAnswer(BaseModel):
    """Same JSON discipline as the real pipeline, so the ONLY variables removed
    are retrieval, the chunk-id whitelist and the validation stage."""

    sections: list[str]      # e.g. ["BNS 303", "IPC 379"]
    judgment: str            # a landmark judgment the model considers relevant


BASELINE_SYS = (
    "You are a legal assistant for Indian police. For the FIR narrative given, "
    "list the applicable charging sections and cite one landmark judgment that "
    "supports the charge. Answer from your knowledge."
)

# (label, narrative, correct primary BNS section(s) — from test-scenarios.md,
#  each cross-checked against the official BNS<->IPC concordance)
CASES = [
    ("theft (motorcycle)",
     "The complainant parked his motorcycle outside a tea stall and went in for "
     "five minutes. When he returned the motorcycle was gone. CCTV from a nearby "
     "shop shows an unknown man riding it away.",
     {"303", "305"}),
    ("robbery (chain snatching)",
     "Two men on a bike intercepted a woman walking home, pushed her to the "
     "ground, and pulled the gold chain from her neck before speeding off. She "
     "suffered minor bruises.",
     {"309", "304"}),
    ("cheating (job fraud)",
     "The accused took Rs 1,50,000 from the complainant promising a government "
     "job. The appointment letter turned out to be fake and he refused to return "
     "the money.",
     {"318", "319"}),
    ("criminal breach of trust",
     "An accounts clerk entrusted with depositing daily cash collections in the "
     "company bank account diverted Rs 4 lakh of the collections to his own "
     "account instead.",
     {"316"}),
    ("murder",
     "The accused stabbed the deceased in the chest with a knife during a "
     "premeditated attack. The deceased died on the spot.",
     {"103", "101"}),
    ("criminal intimidation",
     "The accused sent repeated messages to the complainant threatening to harm "
     "her family if she did not withdraw her complaint.",
     {"351"}),
]

_REPEALED = re.compile(r"\b(IPC|CrPC|Cr\.P\.C|Indian Penal Code|"
                       r"Criminal Procedure Code|Evidence Act)\b", re.I)
_BNS_NUM = re.compile(r"\bBNS[^0-9]{0,6}(\d{1,3})", re.I)


def _citation_of(title: str) -> str | None:
    """The reporter citation part, e.g. 'AIR 1965 SC 1245' / '(1995) 4 SCC 123'."""
    m = re.search(r"(AIR\s+\d{4}\s+[A-Z]{2,3}\s+\d+|\(\d{4}\)\s*\d+\s*SCC\s*\d+)",
                  title, re.I)
    return m.group(1).upper().replace(" ", "") if m else None


def _parties_of(title: str) -> str:
    """Party names, normalised — the citation stripped off."""
    t = re.split(r"(AIR\s+\d{4}|\(\d{4}\))", title, maxsplit=1)[0]
    t = re.sub(r"\b(vs?\.?|versus)\b", "v", t, flags=re.I)
    return re.sub(r"[^a-z ]", " ", t.lower()).split() and " ".join(
        re.sub(r"[^a-z ]", " ", t.lower()).split()) or t.lower().strip()


async def main() -> int:
    await init_pool()
    print(f"Ablation baseline — model {settings.groq_model}, "
          f"NO retrieval / NO chunk whitelist / NO validation\n")
    rows, repealed_hits, wrong_section = [], 0, 0
    seen_citations: dict[str, set[str]] = {}

    for label, narrative, correct in CASES:
        try:
            ans = await llm.complete_json(BASELINE_SYS, narrative, _BaselineAnswer)
        except Exception as e:
            print(f"  {label}: LLM error ({str(e)[:70]}) — skipped")
            continue

        joined = " ; ".join(ans.sections)
        uses_repealed = bool(_REPEALED.search(joined))
        bns_nums = set(_BNS_NUM.findall(joined))
        section_ok = bool(bns_nums & correct)

        parties, citation = _parties_of(ans.judgment), _citation_of(ans.judgment)
        seen_citations.setdefault(parties, set()).add(citation or "(none given)")
        if uses_repealed:
            repealed_hits += 1
        if not section_ok:
            wrong_section += 1

        rows.append((label, joined[:58], uses_repealed, section_ok, ans.judgment))

    print(f"{'case':26} {'repealed?':10} {'BNS ok?':8}")
    print("-" * 78)
    for label, secs, rep, ok, jud in rows:
        print(f"{label:26} {'YES' if rep else 'no':10} {'yes' if ok else 'NO':8}")
        print(f"    cited: {secs}")
        print(f"    judgment: {jud[:66]}")

    n = len(rows)
    contradictions = {p: c for p, c in seen_citations.items() if len(c) > 1}

    print("\n" + "=" * 78)
    print(f"BASELINE (unconstrained LLM), n={n}")
    print(f"  cited a REPEALED code as the charge : {repealed_hits}/{n}")
    print(f"  missed the correct BNS section      : {wrong_section}/{n}")
    print(f"  self-contradicting case-law citations: {len(contradictions)} "
          f"party-name(s) cited with conflicting reporter citations")
    for parties, cites in contradictions.items():
        print(f"      \"{parties}\" -> {sorted(cites)}")
    print("      (at most one of each set can be correct; we do not claim to")
    print("       verify existence — see this file's docstring for why)")
    print("\nCrimeGPT PIPELINE, same offences (from scripts/run_scenarios.py):")
    print("  cited a REPEALED code as the charge : 0  (hard-fail gate; impossible")
    print("                                          — only BNS/special-act chunks")
    print("                                          are retrievable as charges)")
    print("  correct primary section             : 13/13 scenarios")
    print("  self-contradicting citations        : 0  (structurally impossible —")
    print("                                          no generation step exists in")
    print("                                          the case-law path; results are")
    print("                                          returned from the live index)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    finally:
        asyncio.run(close_pool())
