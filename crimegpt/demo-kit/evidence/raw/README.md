# Raw sources — do NOT upload from this folder

These are the inputs the built exhibits were made from, parked here so the file
picker can't offer them during a demo. Uploading a raw source is what puts a
phantom face or a mislabelled portrait into a case's chain of custody, and there
is no delete endpoint to undo it.

| File | What it is |
|---|---|
| `scene-a-source.png` | Night CCTV render → built into `../cctv-scene-2142.jpg` |
| `scene-b-source.png` | Alternate render → built into `../cctv-scene-2142b.jpg`. **1 phantom face** (Haar firing on tea-stall clutter) — the reason it must not be uploaded raw |
| `scene-drawn-fallback.jpg` | The original vector-drawn scene. Kept only as a fallback; shows a bicycle, while the FIR says motorcycle |
| `CCTV-DUPLICATE-of-accused_probe.png` | Byte-identical to `../../faces/accused_probe.png`. Named "CCTV", is actually a studio profile portrait |

Build an exhibit with `../make_cctv.py <source> --scene`; it stamps the CAM-02
overlay and verifies the face count before you ever reach the app.
