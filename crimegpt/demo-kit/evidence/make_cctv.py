"""Apply the CAM-02 overlay to a photo so it reads as a frame from the demo's camera.

Two modes, because the two exhibits need opposite things:

  suspect (default) — a real photo of a person, styled to LOOK like CCTV while
    keeping the face detectable. Heavy filters would defeat the demo, so the
    grade is mild: desaturation, slight noise, scanlines. Expects 1+ faces.

  --scene — a photo that is ALREADY a night CCTV still. Only light grain and
    scanlines are added, so the two exhibits read as one camera without
    degrading a frame that needs no help. Expects 0 faces (the rider's back is
    to the lens; the detector refusing to invent a face is the integrity beat).

Either way the result is VERIFIED against the app's own Haar detector, so you
know before the demo instead of during it.

Usage (from crimegpt/backend, so the venv is available):

    .venv/bin/python ../demo-kit/evidence/make_cctv.py <teammate-photo.jpg>
    .venv/bin/python ../demo-kit/evidence/make_cctv.py <night-cctv.jpg> \
        --scene --time 21:42:11 --out cctv-scene-2142.jpg
"""

import argparse
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def stylise(src: Path, out_name: str, stamp: str, scene: bool) -> Path:
    img = Image.open(src).convert("RGB")
    # keep it big enough that a face stays >= ~100px for the detector
    img.thumbnail((1600, 1600) if scene else (960, 960))
    w, h = img.size

    # CCTV grade: a real night still needs almost none; a daylight portrait needs some
    grey = img.convert("L").convert("RGB")
    img = Image.blend(img, grey, 0.25 if scene else 0.65)
    if not scene:
        img = img.filter(ImageFilter.GaussianBlur(0.6))
    random.seed(7)
    px = img.load()
    for _ in range(int(w * h * (0.01 if scene else 0.02))):
        x, y = random.randrange(w), random.randrange(h)
        g = random.randint(-18, 18)
        r, gg, b = px[x, y]
        px[x, y] = (max(0, min(255, r + g)), max(0, min(255, gg + g)),
                    max(0, min(255, b + g + 6)))
    d = ImageDraw.Draw(img)
    # 12px spacing, not 8: tighter scanlines make the light/dark bands Haar's edge
    # features fire on, and manufacture phantom faces in clutter (verified).
    for y in range(0, h, 12):
        d.line([(0, y), (w, y)], fill=(30, 32, 34), width=1)

    fm = ImageFont.truetype(FONT, max(16, w // 44))
    fs = ImageFont.truetype(FONT, max(13, w // 56))
    d.text((14, 10), "CAM-02  SHREEJI TEA STALL / NAVRANGPURA", font=fs, fill=(215, 215, 200))
    d.text((14, h - fm.size - 14), f"18-08-2026  {stamp}", font=fm, fill=(220, 220, 205))
    d.ellipse([w - 92, 12, w - 78, 26], fill=(200, 60, 50))
    d.text((w - 70, 8), "REC", font=fs, fill=(220, 220, 205))

    out = src.parent / out_name
    img.save(out, "JPEG", quality=84)
    return out


def check_faces(path: Path) -> int:
    import cv2
    clf = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    gray = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    boxes = clf.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5,
                                 minSize=(40, 40))
    return len(boxes)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("photo")
    ap.add_argument("--scene", action="store_true",
                    help="input is already a night CCTV still; expect 0 faces")
    ap.add_argument("--time", default=None, help="HH:MM:SS overlay stamp")
    ap.add_argument("--out", default=None, help="output filename (written beside the input)")
    a = ap.parse_args()

    src = Path(a.photo)
    if not src.exists():
        sys.exit(f"no such file: {src}")
    stamp = a.time or ("21:42:11" if a.scene else "21:43:05")
    out_name = a.out or ("cctv-scene-2142.jpg" if a.scene else "cctv-suspect-2143.jpg")

    out = stylise(src, out_name, stamp, a.scene)
    n = check_faces(out)
    print(f"wrote {out}")
    if a.scene:
        print(f"faces detected in the scene frame: {n}"
              + ("  — GOOD TO DEMO (no face to invent)" if n == 0 else
                 "  — PROBLEM: the rider's face is visible; use a frame shot from behind"))
    else:
        print(f"faces detected in the styled frame: {n}"
              + ("  — GOOD TO DEMO" if n >= 1 else
                 "  — NOT usable: retake with a brighter, frontal photo"))
