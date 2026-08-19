"""Score a probe photo against candidate photos using the app's OWN face module.

Run this BEFORE the demo so you know the numbers the jury will see. It calls
app.face.match — the same code path the /face/match endpoint uses — so a score
printed here is the score the UI will show.

Usage (from crimegpt/backend, so the venv + app code are available):

    .venv/bin/python ../demo-kit/evidence/check_match.py <probe.jpg> <candidate.jpg> [more...]

Reminder: the matcher is pixel correlation on normalised face crops, not an
embedding model. Two frontal faces of DIFFERENT people still score well above
zero. What you are checking is that the same-person pair ranks ABOVE any
other-person control — if the gap is thin, say so on stage instead of claiming
identification.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.getcwd())   # run from crimegpt/backend so `app` imports
from app import face


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        sys.exit(__doc__)
    probe = Path(argv[1])
    cands = [{"id": i, "label": p, "path": p} for i, p in enumerate(argv[2:], 1)]
    for p in [probe, *[Path(c["path"]) for c in cands]]:
        if not p.exists():
            sys.exit(f"no such file: {p}")

    result = face.match(probe.read_bytes(), cands)
    print(f"probe {probe.name}: faces detected = {result['probe_faces']}")
    if not result["probe_faces"]:
        print("  -> probe unusable: no face found. Use a brighter, frontal shot.")
    for m in result["matches"]:
        print(f"  {m['score']:.3f}  {m['label']}  (faces: {m['faces']})")
    missing = {c["path"] for c in cands} - {m["label"] for m in result["matches"]}
    for p in sorted(missing):
        print(f"  ----   {p}  (no face detected — not demoable)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
