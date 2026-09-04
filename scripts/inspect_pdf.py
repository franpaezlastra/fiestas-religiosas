"""Inspect the book PDF: page count, keyword hits, extract key pages as PNG."""
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Peregrinos final en baja.pdf"
OUT = ROOT / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)

KEYWORDS = [
    "sabat",
    "bergoglio",
    "francisco",
    "calendario",
    "mapa",
    "créditos",
    "creditos",
    "isbn",
    "fontanarrosa",
    "homenaje",
    "santos y beatos",
    "tapa",
    "contratapa",
]

doc = pymupdf.open(PDF)
print(f"pages={doc.page_count} metadata={doc.metadata}")

hits = {k: [] for k in KEYWORDS}
for i, page in enumerate(doc):
    text = page.get_text("text") or ""
    low = text.lower()
    for k in KEYWORDS:
        if k in low:
            hits[k].append(i)
    if i < 40 or i in (0, 1, 2) or i > doc.page_count - 8:
        snippet = " ".join(text.split())[:240]
        print(f"\n--- page {i+1}/{doc.page_count} ---\n{snippet}")

print("\n=== KEYWORD HITS (0-based page index) ===")
for k, pages in hits.items():
    print(f"{k}: {pages[:40]}{' ...' if len(pages) > 40 else ''} (n={len(pages)})")

# Render likely pages at moderate DPI for web
CANDIDATES = set()
CANDIDATES.update(range(0, 8))  # cover / prelim
CANDIDATES.update(range(24, 36))  # timeline, calendar, map
# first hits for sabat / homenaje / calendario / mapa
for k in ("sabat", "calendario", "mapa", "homenaje", "bergoglio", "isbn"):
    CANDIDATES.update(hits[k][:6])

# extract a few pages around first sabat hit
if hits["sabat"]:
    s = hits["sabat"][0]
    CANDIDATES.update(range(max(0, s - 1), min(doc.page_count, s + 3)))

zoom = pymupdf.Matrix(1.5, 1.5)
extracted = []
for i in sorted(CANDIDATES):
    pix = doc[i].get_pixmap(matrix=zoom, alpha=False)
    dest = OUT / f"pdf-p{i+1:03d}.jpg"
    pix.save(dest.as_posix(), output="jpeg", jpg_quality=82)
    extracted.append(dest.name)

print("\n=== EXTRACTED ===")
print("\n".join(extracted))
doc.close()
