"""Face detection + demonstrative matching (P7).

Detection is real: OpenCV's Haar-cascade frontal-face detector. Matching is a
lightweight, transparent heuristic — normalised grayscale face crops compared by
correlation — NOT a forensic identification. It demonstrates the workflow
(enrol accused photos as evidence, then match a probe) without shipping a heavy
deep-learning dependency. Swap in a real embedding model (FaceNet/ArcFace) behind
`_signature()` / `_similarity()` to harden it; callers do not change.

cv2 is imported lazily so the rest of the API runs even if OpenCV is absent.
"""

from __future__ import annotations

import numpy as np

_CROP = 100  # normalised face-crop size


class FaceError(RuntimeError):
    pass


def _cv2():
    try:
        import cv2
        return cv2
    except ImportError:
        raise FaceError(
            "OpenCV not installed. Install it: pip install opencv-python-headless"
        )


def _cascade():
    cv2 = _cv2()
    clf = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    if clf.empty():
        raise FaceError("could not load Haar cascade for face detection")
    return clf


def _gray_from_bytes(data: bytes):
    cv2 = _cv2()
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise FaceError("file is not a readable image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def _gray_from_path(path: str):
    cv2 = _cv2()
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FaceError(f"could not read image: {path}")
    return img


def _detect(gray) -> list[tuple[int, int, int, int]]:
    boxes = _cascade().detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
    )
    return [tuple(int(v) for v in b) for b in boxes]


def _signatures(gray) -> list[np.ndarray]:
    """Normalised, histogram-equalised face crops as flat float vectors."""
    cv2 = _cv2()
    sigs = []
    for (x, y, w, h) in _detect(gray):
        crop = gray[y : y + h, x : x + w]
        crop = cv2.resize(crop, (_CROP, _CROP))
        crop = cv2.equalizeHist(crop)
        v = crop.astype(np.float32).flatten()
        v -= v.mean()
        n = np.linalg.norm(v)
        sigs.append(v / n if n else v)
    return sigs


def _similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine correlation of two normalised crops, clamped to 0..1."""
    return max(0.0, min(1.0, float(np.dot(a, b))))


def count_faces_in_file(path: str) -> int:
    return len(_detect(_gray_from_path(path)))


def match(probe: bytes, candidates: list[dict]) -> dict:
    """Match a probe image against candidate evidence images.

    candidates: [{"id","label","path"}]. Returns probe_faces + ranked matches
    [{"evidence_id","label","score","faces"}]."""
    probe_sigs = _signatures(_gray_from_bytes(probe))
    matches = []
    for c in candidates:
        try:
            cand_sigs = _signatures(_gray_from_path(c["path"]))
        except FaceError:
            continue
        best = 0.0
        for ps in probe_sigs:
            for cs in cand_sigs:
                best = max(best, _similarity(ps, cs))
        if cand_sigs:
            matches.append({
                "evidence_id": str(c["id"]),
                "label": c.get("label"),
                "score": round(best, 3),
                "faces": len(cand_sigs),
            })
    matches.sort(key=lambda m: m["score"], reverse=True)
    return {"probe_faces": len(probe_sigs), "matches": matches}
