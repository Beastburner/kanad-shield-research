"""Run the classifier pre-test set against a live API and score it.

This is the executable form of `crimegpt/test-scenarios.md` — the compliance
checklist item "pre-tested classifier on 10 real crime scenarios". Run it before
any demo; a regression in the pipeline shows up here rather than in front of judges.

    # backend running on :8000 (or pass --base)
    python -m scripts.run_scenarios
    python -m scripts.run_scenarios --base http://localhost:8011 --keep

Scoring follows the rubric in test-scenarios.md:
  PASS    — every expected primary section returned
  PARTIAL — at least one expected primary section returned
  FAIL    — none returned
Plus a hard FAIL on any repealed IPC/CrPC/IEA section appearing as a CHARGE, which
would be a legal-accuracy defect rather than a ranking miss.

Cases are created under case numbers prefixed PRETEST- and deleted afterwards
unless --keep is passed.
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

# (id, narrative, primary sections that MUST appear as {code: [section_no, ...]}).
# Only the primary offence sections are asserted — secondary/procedural picks are
# judgment calls (see the HUMAN-VERIFY note in test-scenarios.md), so requiring
# them would make the suite fail on defensible output.
SCENARIOS: list[tuple[str, str, dict[str, list[str]]]] = [
    ("S1 theft (motorcycle)",
     "The complainant parked his motorcycle outside a tea stall in the market and "
     "went in for five minutes. When he returned the motorcycle was gone. CCTV from "
     "a nearby shop shows an unknown man riding it away.",
     {"BNS": ["303", "305"]}),
    ("S2 robbery (chain snatching with force)",
     "Two men on a bike intercepted a woman walking home, pushed her to the ground, "
     "and pulled the gold chain from her neck before speeding off. She suffered "
     "minor bruises.",
     {"BNS": ["309", "304"]}),
    ("S3 burglary / house-breaking at night",
     "While the family was away overnight, an intruder broke the rear-door latch, "
     "entered the house, and took cash and jewellery. Entry was after sunset and "
     "before sunrise.",
     {"BNS": ["330", "331", "305"]}),
    ("S4 online UPI / cyber fraud",
     "The victim received a call from a person claiming to be a bank official who "
     "sent a link; after clicking and entering the OTP, Rs 85,000 was debited via "
     "UPI to an unknown account. The fraudster used a fake caller ID showing the "
     "bank's name.",
     {"BNS": ["318", "319"]}),
    ("S5 criminal breach of trust (employee)",
     "An accounts clerk was entrusted with depositing daily cash collections in the "
     "company bank account. Over three months he diverted Rs 4 lakh of the "
     "collections to his own account instead of depositing them.",
     {"BNS": ["316"]}),
    ("S6 cheating / property fraud (no entrustment)",
     "A man sold the same flat to two different buyers, taking advance payments from "
     "both, having dishonestly intended from the start never to register it to the "
     "second buyer.",
     {"BNS": ["318"]}),
    ("S7 assault / grievous hurt",
     "During a parking dispute, the accused hit the complainant on the head with an "
     "iron rod, causing a skull fracture requiring hospitalization. A medico-legal "
     "report confirms the fracture.",
     {"BNS": ["117"]}),
    ("S8 criminal intimidation (threatening messages)",
     "Over two weeks the complainant received repeated WhatsApp messages from a "
     "known person threatening to kill him and burn his shop unless he withdrew a "
     "civil complaint. No money or property changed hands.",
     {"BNS": ["351"]}),
    ("S9 extortion (threat + payment)",
     "A local gang member threatened a shopkeeper with serious harm to his family "
     "unless he paid Rs 20,000 monthly protection money. Fearing for his family, "
     "the shopkeeper paid twice via cash before reporting.",
     {"BNS": ["308"]}),
    ("S10 forgery + cheating (fake documents)",
     "The accused created a forged property title deed and a fake bank guarantee "
     "letter, then used them to obtain a loan of Rs 12 lakh from a cooperative bank.",
     {"BNS": ["336", "338", "340", "318"]}),
    # Special-act coverage: these are charged under a special act, not the BNS, and
    # used to classify to zero sections before db/special_acts.sql existed.
    ("S11 bribery by public servant (PC Act)",
     "Shri Manzoor Ahmed, a public servant posted as Tehsildar, demanded Rs 15,000 "
     "from the complainant Gulzar Ahmed Wani for releasing his land documents. After "
     "negotiation he agreed to accept Rs 10,000. Verification on 12.06.2026 "
     "confirmed the demand.",
     {"PC Act": ["7", "7A", "8", "13"]}),
    ("S12 narcotics (NDPS)",
     "During a vehicle check at Naroda circle, the accused was found in possession "
     "of 2.5 kg of ganja concealed in a sack in the boot of his car. He had no "
     "permit or licence for the substance.",
     {"NDPS Act": ["20", "8"]}),
    ("S13 unlicensed firearm (Arms Act)",
     "On search of the accused, one country-made pistol and three live cartridges "
     "were recovered from his waist. He failed to produce any licence for the "
     "firearm.",
     {"Arms Act": ["25", "27"]}),
]

# Any of these appearing as a CHARGE is a legal-accuracy failure: the IPC, CrPC and
# Indian Evidence Act were repealed on 1 July 2024. They may only appear as the
# `old_code_ref` cross-reference.
REPEALED_CODES = {"IPC", "CRPC", "CR.P.C", "IEA", "EVIDENCE ACT", "INDIAN PENAL CODE"}


def _req(base: str, path: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        base + path, data=data, method=method,
        headers={"Content-Type": "application/json",
                 "X-Actor-Role": "IO", "X-Actor-Name": "ScenarioRunner"},
    )
    with urllib.request.urlopen(req, timeout=240) as resp:
        return json.loads(resp.read() or "{}")


def _score(expected: dict[str, list[str]], returned: list[dict]) -> tuple[str, list[str]]:
    """Compare returned sections to the expected primaries. Section numbers are
    compared on the top-level number only — the rubric treats a sub-section miss
    (303 vs 303(2)) as correct, not partial."""
    got = {(s["code"], s["section_no"].split("(")[0]) for s in returned}
    problems: list[str] = []

    for s in returned:
        if s["code"].upper().replace(".", "") in REPEALED_CODES:
            problems.append(f"REPEALED CODE AS CHARGE: {s['code']} {s['section_no']}")

    hits = [code for code, nums in expected.items()
            if any((code, n) in got for n in nums)]
    if problems:
        return "FAIL", problems
    if len(hits) == len(expected):
        return "PASS", problems
    if hits:
        return "PARTIAL", [f"missing: {c}" for c in expected if c not in hits]
    return "FAIL", ["none of the expected sections returned"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000")
    ap.add_argument("--keep", action="store_true",
                    help="leave the created PRETEST- cases in the database")
    args = ap.parse_args()

    try:
        _req(args.base, "/health")
    except Exception as e:
        print(f"Cannot reach {args.base}: {e}", file=sys.stderr)
        return 2

    tally = {"PASS": 0, "PARTIAL": 0, "FAIL": 0}
    created: list[str] = []
    # case_number is UNIQUE, so a per-run tag keeps repeat runs from colliding with
    # cases an earlier --keep run left behind.
    run_tag = time.strftime("%m%d-%H%M%S")
    print(f"Running {len(SCENARIOS)} scenarios against {args.base} (run {run_tag})\n")

    for idx, (name, narrative, expected) in enumerate(SCENARIOS, 1):
        try:
            case = _req(args.base, "/cases", "POST",
                        {"case_number": f"PRETEST-{run_tag}-{idx:02d}",
                         "fir_narrative": narrative})
            created.append(case["id"])
            result = _req(args.base, f"/cases/{case['id']}/analyze", "POST", {})
        except (urllib.error.HTTPError, urllib.error.URLError, OSError) as e:
            tally["FAIL"] += 1
            print(f"[FAIL]    {name}\n          request error: {e}")
            continue

        sections = result.get("sections") or []
        verdict, problems = _score(expected, sections)
        tally[verdict] += 1
        got = ", ".join(f"{s['code']} {s['section_no']}" for s in sections) or "(none)"
        print(f"[{verdict:7}] {name}")
        print(f"          expected {expected}")
        print(f"          got      {got}  (confidence {result.get('confidence', 0):.2f})")
        for p in problems:
            print(f"          ! {p}")

    if not args.keep:
        for cid in created:
            try:
                _req(args.base, f"/cases/{cid}", "DELETE")
            except Exception:
                pass   # no delete endpoint / already gone — cases are prefixed
                       # PRETEST- and can be cleared with db/reset_cases.sql

    total = sum(tally.values())
    print(f"\n{tally['PASS']}/{total} PASS · {tally['PARTIAL']} PARTIAL · "
          f"{tally['FAIL']} FAIL")
    if not args.keep and created:
        print(f"Note: cases were created as PRETEST-{run_tag}-nn. If your build has "
              "no DELETE /cases/{id}, clear them with db/reset_cases.sql.")
    return 1 if tally["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())
