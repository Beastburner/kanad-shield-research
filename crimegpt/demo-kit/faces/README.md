# Accused photographs (and face-match test photos)

**Upload only from this folder for portraits, and only from `../evidence/` for
CCTV exhibits.** Raw sources live in `../evidence/raw/` and must not be uploaded
— see that folder's README for why.

Current contents, all verified against the app's own detector:

| File | Detector | Use |
|---|---|---|
| `accused.png` | 1 face | Evidence Locker — *Accused photograph — front* |
| `accused_probe.png` | 0 faces (90° profile; the frontal cascade cannot read profiles) | Evidence Locker — *Accused photograph — profile* |
| `otherperson.png` | 1 face | Negative control for `check_match.py`. Do NOT upload — he is not in the case |

The front/profile pair's real home is the **Accused Face Identification Form**
(Tab 3), one of the seven PS document types — not the face matcher.

---

## Face-match test photos — bring your own (deliberately)

This folder is empty on purpose. We generated synthetic drawn faces and tested
them against the app's actual detector — **the Haar cascade correctly refuses
them (0 faces detected)**, which is honest behaviour: the matcher should not
light up on cartoons.

To test the face feature you need two REAL photos of the same person:

1. `accused.jpg` — a clear, frontal, well-lit photo of a teammate
   (shoulders-up, no sunglasses, face ≥ 200 px tall in the frame).
2. `probe.jpg` — a DIFFERENT photo of the same teammate (another day, another
   angle up to ~15°, different clothes — that's what makes the match meaningful).

Optional negative control: `other-person.jpg` — someone else, to show the score
ranks lower.

For the full jury story, don't upload the raw photo directly — first run it
through `../evidence/make_cctv.py`, which styles it as a CCTV frame (matching
the scene exhibit `evidence/cctv-scene-2142.jpg`) and verifies the face is
still detectable. Then follow WALKTHROUGH.md §8.3: scene exhibit → suspect
frame → match against the clean photo.

## If you'd rather not use a teammate's face: generate one

Photoreal AI portraits DO pass the detector (it is the drawn/cartoon ones it
refuses). Ask an image model for a **fictional** person — never a real person's
likeness, the same line the BharatPol mock draws — and prompt for photography,
not illustration:

> Photorealistic portrait photograph of a fictional 30-year-old Indian man,
> shoulders-up, facing the camera straight on, neutral expression, even indoor
> daylight, plain wall background, no sunglasses, sharp focus, face filling most
> of the frame, 50mm lens. Not an illustration, not a 3D render.

For `probe.jpg`, **edit that same image** ("same person, same face, turned ~15°
to his left, different shirt, slightly warmer light") rather than generating a
fresh one from text — a fresh render drifts, and this matcher is correlation on
normalised crops, so pose and lighting move the score more than identity does.

Download at full resolution (a screenshot shrinks the face below the 40 px
detector floor), then verify both files before the demo:

    .venv/bin/python ../demo-kit/evidence/check_match.py \
        ../demo-kit/faces/probe.jpg ../demo-kit/faces/cctv-suspect-2143.jpg \
        ../demo-kit/faces/other-person.jpg

The same-person pair must rank ABOVE the control. Different people still score
well above zero here — if the gap is thin, say that on stage rather than
claiming identification.

Phone photos work fine. Avoid: group photos (multiple faces are fine but muddy
the demo), heavy backlight, and low-res CCTV stills — the detector will honestly
return `faces: 0` on those.
