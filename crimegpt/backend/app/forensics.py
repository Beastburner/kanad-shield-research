"""Document tamper screening — triage signals, never verdicts.

Two distinct problems, and this module only claims to help with the second:

  1. Integrity AFTER receipt — already solved elsewhere: SHA-256 at the moment
     of intake (evidence.py / integrity.py), append-only audit log. Any change
     after receipt changes the hash. Tamper-EVIDENT custody.
  2. Authenticity BEFORE receipt — was the file forged or manipulated before it
     was handed to the police? No hash can answer that, and no software can
     answer it conclusively. Certified opinion belongs to the FSL / Examiner of
     Electronic Evidence (the same reason the s.63 certificate's Part B is left
     blank for the expert).

What CAN be done at intake is SCREENING: cheap, deterministic signals that a
file deserves a closer look — the same way a duty officer eyeballs a paper
document for whitener and mismatched ink. Every finding is a flag with an
explanation, graded info/caution/warning, and the response carries a standing
note that this is triage, not a forensic finding. Fail-closed philosophy in
reverse: we surface suspicion, we never assert forgery.

Checks (all offline, no LLM, deps already in requirements — PyMuPDF, PIL, numpy):

  PDF:
    - incremental updates    the PDF format APPENDS on edit; more than one
                             startxref/%%EOF means the file was modified after
                             it was first written (legitimate for e-sign
                             workflows — hence caution, not verdict)
    - metadata               CreationDate vs ModDate mismatch; Producer/Creator
                             naming an editing tool rather than a scanner
    - text-over-scan         a page that is a full-page image but ALSO carries a
                             text layer: could be a legitimate OCR layer, could
                             be text pasted over a scan
    - signature present      /Sig fields noted so the officer verifies them
                             externally (DigiLocker/eSign docs are signed)
  Image:
    - EXIF software tag      names an image editor
    - EXIF timestamps        DateTime vs DateTimeOriginal mismatch, or EXIF
                             stripped entirely (normal for WhatsApp forwards —
                             said so in the explanation)
    - ELA (JPEG only)        error-level analysis: recompress and measure how
                             unevenly the error distributes. Reported as a score
                             with interpretation guidance, severity capped at
                             info — ELA is indicative, famously not proof.
"""

import io
import re
from datetime import datetime

import fitz  # PyMuPDF
import numpy as np
from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS

# Producer/Creator strings that indicate an editing tool touched the file.
_EDITOR_HINTS = (
    "photoshop", "gimp", "canva", "ilovepdf", "sejda", "smallpdf", "pdf-xchange",
    "foxit", "nitro", "pdfescape", "sodapdf", "picsart", "snapseed", "pixlr",
)
# Strings typical of scanner/capture pipelines (their presence is reassuring).
_SCANNER_HINTS = (
    "scanner", "scan", "canon", "epson", "xerox", "ricoh", "konica", "kyocera",
    "hp ", "brother", "camscanner", "genius scan", "adobe scan",
)


class ScreeningError(RuntimeError):
    pass


def _flag(check: str, severity: str, finding: str, detail: str) -> dict:
    return {"check": check, "severity": severity, "finding": finding, "detail": detail}


_NOTE = (
    "Screening result — NOT a forensic finding. These are triage signals for the "
    "officer; several have innocent explanations (noted per flag). For a certified "
    "opinion, route the original to the FSL / an Examiner of Electronic Evidence "
    "under s.79A IT Act. The file's SHA-256 recorded at intake makes any LATER "
    "modification detectable regardless of these flags."
)


def screen(data: bytes, filename: str = "") -> dict:
    """Run every applicable check. Returns {kind, flags: [...], note}."""
    if data[:5] == b"%PDF-":
        flags = _screen_pdf(data)
        kind = "pdf"
    else:
        flags = _screen_image(data)
        kind = "image"
    if not flags:
        flags.append(_flag(
            "overall", "info", "No tamper signals detected",
            "None of the screening checks fired. Absence of flags is not proof "
            "of authenticity — sophisticated forgeries screen clean.",
        ))
    return {"kind": kind, "flags": flags, "note": _NOTE}


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
def _screen_pdf(data: bytes) -> list[dict]:
    flags: list[dict] = []
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        raise ScreeningError("file is not a readable PDF")

    with doc:
        # 1. Incremental updates. A PDF edit APPENDS a new xref section; the
        #    original bytes stay in the file. >1 startxref ⇒ modified after it
        #    was first written. (Linearised files can carry an extra one — the
        #    count is reported so the officer sees magnitude.)
        starts = data.count(b"startxref")
        if starts > 1:
            flags.append(_flag(
                "pdf.incremental_updates", "warning",
                f"File was modified after creation ({starts - 1} incremental update(s))",
                "The PDF format appends edits rather than rewriting the file, so "
                "earlier content may still be recoverable from this same file. "
                "Legitimate for e-signature workflows; suspicious for a document "
                "claimed to be an untouched scan.",
            ))

        # 2. Metadata.
        meta = doc.metadata or {}
        created, modified = meta.get("creationDate", ""), meta.get("modDate", "")
        if created and modified and created != modified:
            flags.append(_flag(
                "pdf.dates", "caution",
                "Creation and modification timestamps differ",
                f"CreationDate={_pdf_date(created)} vs ModDate={_pdf_date(modified)}. "
                "Expected to match for a straight-from-scanner file.",
            ))
        tool = f"{meta.get('producer', '')} {meta.get('creator', '')}".lower()
        editor = next((h for h in _EDITOR_HINTS if h in tool), None)
        if editor:
            flags.append(_flag(
                "pdf.software", "caution",
                f"Produced or edited with '{editor}'",
                f"Producer/Creator metadata: {meta.get('producer', '')!r} / "
                f"{meta.get('creator', '')!r}. An editing tool in the chain does "
                "not prove tampering, but a claimed scan should name a scanner.",
            ))
        elif tool.strip() and not any(h in tool for h in _SCANNER_HINTS):
            flags.append(_flag(
                "pdf.software", "info",
                "Producing software is not a recognised scanner pipeline",
                f"Producer/Creator: {meta.get('producer', '')!r} / {meta.get('creator', '')!r}.",
            ))

        # 3. Text layer over a scanned page.
        for i, page in enumerate(doc):
            covers = any(
                (r.width * r.height) / max(page.rect.width * page.rect.height, 1) > 0.8
                for img in page.get_images(full=True)
                for r in page.get_image_rects(img[0])
            )
            text_len = len(page.get_text().strip())
            if covers and text_len > 50:
                flags.append(_flag(
                    "pdf.text_over_scan", "caution",
                    f"Page {i + 1} is a full-page image but also carries a text layer "
                    f"({text_len} chars)",
                    "An invisible OCR layer is a legitimate cause. Text pasted OVER "
                    "a scan is the tampering cause. Compare the text layer against "
                    "what the image visually shows.",
                ))
                break  # one flag is enough; officer will inspect the whole file

        # 4. Digital signature fields — a lead, not a verdict.
        if b"/Sig" in data:
            flags.append(_flag(
                "pdf.signature", "info",
                "Digital signature field present",
                "Verify the signature with an external validator (e.g. Adobe "
                "Reader / DigiLocker). A VALID signature is strong evidence of "
                "integrity; a BROKEN one is strong evidence of tampering.",
            ))
    return flags


def _pdf_date(raw: str) -> str:
    m = re.match(r"D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})", raw or "")
    if not m:
        return raw or "unknown"
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)} {m.group(4)}:{m.group(5)}"


# ---------------------------------------------------------------------------
# Image
# ---------------------------------------------------------------------------
def _screen_image(data: bytes) -> list[dict]:
    flags: list[dict] = []
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except UnidentifiedImageError:
        raise ScreeningError("file is not a readable image or PDF")

    exif = {}
    try:
        exif = {TAGS.get(k, str(k)): v for k, v in (img.getexif() or {}).items()}
    except Exception:
        pass

    software = str(exif.get("Software", "")).lower()
    editor = next((h for h in _EDITOR_HINTS if h in software), None)
    if editor:
        flags.append(_flag(
            "image.software", "warning",
            f"EXIF names an image editor: '{exif.get('Software')}'",
            "The camera's Software tag was overwritten by an editing tool — the "
            "image was processed after capture.",
        ))

    dt, dt_orig = exif.get("DateTime"), exif.get("DateTimeOriginal")
    if dt and dt_orig and dt != dt_orig:
        flags.append(_flag(
            "image.dates", "caution",
            "EXIF modification time differs from capture time",
            f"DateTimeOriginal={dt_orig} vs DateTime={dt}. The file was re-saved "
            "after it was taken.",
        ))

    if not exif:
        flags.append(_flag(
            "image.exif_missing", "info",
            "No EXIF metadata",
            "Metadata was stripped. WhatsApp and most social platforms do this "
            "routinely, so on its own this is weak — but it also means capture "
            "time and device cannot be corroborated from the file.",
        ))

    if img.format == "JPEG":
        score = _ela_score(img)
        if score is not None:
            flags.append(_flag(
                "image.ela", "info",
                f"Error-level analysis score: {score}",
                "Ratio of the strongest recompression error to the typical error. "
                "Roughly: uniform (<8) is consistent with a single save; a high "
                "ratio (>15) can indicate a locally edited/pasted region — or just "
                "sharp text on a flat background. Indicative only; never proof.",
            ))
    return flags


def _ela_score(img: Image.Image) -> float | None:
    """Recompress at a fixed quality and measure how unevenly the error lands.
    Edited regions tend to re-compress differently from the rest of the image."""
    try:
        rgb = img.convert("RGB")
        buf = io.BytesIO()
        rgb.save(buf, "JPEG", quality=90)
        resaved = Image.open(buf)
        diff = np.abs(
            np.asarray(rgb, dtype=np.int16) - np.asarray(resaved, dtype=np.int16)
        ).mean(axis=2)
        median = float(np.median(diff)) or 0.5  # flat images have ~0 median
        p99 = float(np.percentile(diff, 99))
        return round(p99 / median, 1)
    except Exception:
        return None
