"""Extract keyword index + selected pages as JPEG (UTF-8 safe)."""
from pathlib import Path
import sys
import pymupdf

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Peregrinos final en baja.pdf"
OUT = ROOT / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)
INDEX = ROOT / "scripts" / "pdf-index.txt"

KEYWORDS = [
    "sabat",
    "bergoglio",
    "calendario",
    "mapa de",
    "créditos",
    "creditos",
    "isbn",
    "fontanarrosa",
    "homenaje",
    "santos y beatos",
    "alfredo",
]

doc = pymupdf.open(PDF)
lines = [f"pages={doc.page_count}"]
hits = {k: [] for k in KEYWORDS}

for i, page in enumerate(doc):
    text = page.get_text("text") or ""
    low = text.lower()
    for k in KEYWORDS:
        if k in low:
            hits[k].append(i + 1)
    snippet = " ".join(text.split())[:400]
    lines.append(f"\n===== PAGE {i+1} =====\n{snippet}")

lines.append("\n\n=== HITS ===")
for k, pages in hits.items():
    lines.append(f"{k}: {pages} (n={len(pages)})")

INDEX.write_text("\n".join(lines), encoding="utf-8")
print(INDEX.read_text(encoding="utf-8").split("=== HITS ===")[-1])

# Book page ≈ PDF page (324 pp book, 324 pp PDF)
PAGES = {
    "tapa-tipografica": 1,
    "portada-interior": 3,
    "papa-portadilla": 13,
    "tapas-diarios-eleccion": 17,
    "timeline-bergoglio": 26,
    "calendario": 30,
    "mapa-libro": 31,
}

# Add first sabat pages and last 8 (credits / colophon)
if hits["sabat"]:
    for p in hits["sabat"][:4]:
        PAGES[f"sabat-p{p}"] = p
if hits["santos y beatos"]:
    for p in hits["santos y beatos"][:3]:
        PAGES[f"santos-p{p}"] = p
for i in range(doc.page_count - 6, doc.page_count + 1):
    PAGES[f"cierre-p{i}"] = i

# Nearby pages around timeline / calendar / map
for p in range(26, 33):
    PAGES[f"libro-p{p}"] = p
for p in (17, 18, 23, 24, 25, 27, 28, 29):
    PAGES[f"papa-p{p}"] = p

zoom = pymupdf.Matrix(1.6, 1.6)
seen = set()
for name, num in PAGES.items():
    if num in seen or num < 1 or num > doc.page_count:
        continue
    seen.add(num)
    pix = doc[num - 1].get_pixmap(matrix=zoom, alpha=False)
    dest = OUT / f"{name}.jpg"
    pix.save(dest.as_posix(), output="jpeg", jpg_quality=85)
    print(f"extracted {dest.name} ({pix.width}x{pix.height})")

doc.close()
