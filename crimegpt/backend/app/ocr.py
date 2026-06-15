"""FIR ingestion for scanned / digital documents.

Accepts an image (PNG/JPG/TIFF) or a PDF and returns text:
- Image  -> Tesseract OCR (PS suggested tool).
- PDF    -> use the embedded text layer if the PDF is digital (fast, exact);
            otherwise rasterise each page and OCR it (scanned PDF).

PDF handling uses PyMuPDF (fitz), which needs no external system binary."""

import io

import fitz  # PyMuPDF
import pytesseract
from PIL import Image, UnidentifiedImageError

# If a PDF's embedded text layer has at least this many characters we treat it as
# a digital PDF and skip OCR; below it we assume a scanned PDF and OCR the pages.
_MIN_PDF_TEXT = 30
_OCR_DPI = 200


class OcrError(RuntimeError):
    pass


def extract_text(data: bytes, lang: str = "eng") -> tuple[str, str]:
    """Return (text, source). `source` is 'image_ocr' | 'pdf_text' | 'pdf_ocr'.

    `lang` is a Tesseract language code (e.g. 'eng', 'hin', 'guj', 'eng+hin');
    the matching language pack must be installed for OCR paths."""
    if data[:5] == b"%PDF-":
        return _extract_pdf(data, lang)
    return _ocr_image(data, lang), "image_ocr"


def _ocr_image(data: bytes, lang: str) -> str:
    try:
        img = Image.open(io.BytesIO(data))
    except UnidentifiedImageError:
        raise OcrError("uploaded file is not a readable image or PDF")
    return _run_tesseract(img, lang)


def _extract_pdf(data: bytes, lang: str) -> tuple[str, str]:
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        raise OcrError("uploaded file is not a readable PDF")
    with doc:
        # 1) digital PDF — use the embedded text layer directly.
        text = "\n".join(p.get_text().strip() for p in doc).strip()
        if len(text) >= _MIN_PDF_TEXT:
            return text, "pdf_text"
        # 2) scanned PDF — rasterise each page and OCR it.
        pages = []
        for page in doc:
            png = page.get_pixmap(dpi=_OCR_DPI).tobytes("png")
            pages.append(_run_tesseract(Image.open(io.BytesIO(png)), lang))
    return "\n".join(p for p in pages if p).strip(), "pdf_ocr"


def _run_tesseract(img: Image.Image, lang: str) -> str:
    try:
        return pytesseract.image_to_string(img, lang=lang).strip()
    except pytesseract.TesseractNotFoundError:
        raise OcrError(
            "Tesseract binary not found. Install it: sudo apt-get install -y tesseract-ocr"
        )
