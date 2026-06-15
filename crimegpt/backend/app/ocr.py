"""OCR ingestion for scanned FIR / documents (PS suggested tool: Tesseract).

Extracts text from an uploaded image so a scanned FIR can be turned into a case
narrative and fed into the pipeline. Images only (PNG/JPG/TIFF); for scanned PDFs
add pdf2image + poppler and rasterise pages before calling extract_text()."""

import io

import pytesseract
from PIL import Image, UnidentifiedImageError


class OcrError(RuntimeError):
    pass


def extract_text(data: bytes, lang: str = "eng") -> str:
    """Run Tesseract over image bytes and return the recognised text.

    `lang` is a Tesseract language code (e.g. 'eng', 'hin', 'guj', or 'eng+hin').
    The matching tesseract language pack must be installed on the host."""
    try:
        img = Image.open(io.BytesIO(data))
    except UnidentifiedImageError:
        raise OcrError("uploaded file is not a readable image")
    try:
        text = pytesseract.image_to_string(img, lang=lang)
    except pytesseract.TesseractNotFoundError:
        raise OcrError(
            "Tesseract binary not found. Install it: sudo apt-get install -y tesseract-ocr"
        )
    return text.strip()
