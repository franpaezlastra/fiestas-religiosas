"""Dump embedded images from the brochure and crop known panels."""
from pathlib import Path
import sys
import pymupdf

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Folleto suelto Peregrinos_C.pdf"
OUT = ROOT / "public" / "images"
TMP = ROOT / "scripts" / "_folleto-preview"
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)

doc = pymupdf.open(PDF)

# Embedded images from page 2 (santos + famosos + tapa)
page = doc[1]
for n, info in enumerate(page.get_images(full=True), start=1):
    xref = info[0]
    try:
        pix = pymupdf.Pixmap(doc, xref)
        if pix.n - pix.alpha >= 4:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        if pix.width < 80 or pix.height < 80:
            continue
        name = TMP / f"p2-img-{n:02d}-{pix.width}x{pix.height}.jpg"
        pix.save(name.as_posix(), output="jpeg", jpg_quality=88)
        print(name.name)
    except Exception as e:
        print("skip", n, e)
    print(f"{name.name}")

# Render page 2 at high zoom for manual crops (PDF points → pixels at 2.2x)
# page size 2466 x 567
zoom = 2.2
pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
full = TMP / "folleto-p2.jpg"
pix.save(full.as_posix(), output="jpeg", jpg_quality=90)
w, h = pix.width, pix.height
print("full", w, h)

# Left panel ≈ first ~22% of the spread (santos sketches)
# Famous Argentines vitral sits roughly 22–48%
# We'll save several candidate strips to inspect.
from PIL import Image

im = Image.open(full)
strips = {
    "santos-panel": (0, 0, int(w * 0.235), int(h * 0.88)),
    "famosos-vitral": (int(w * 0.235), int(h * 0.38), int(w * 0.52), int(h * 0.88)),
}
for name, box in strips.items():
    crop = im.crop(box)
    dest = TMP / f"crop-{name}.jpg"
    crop.save(dest, quality=90)
    print(name, crop.size, dest.name)

doc.close()

# Crop ONLY the Argentina map from the book infographic
book = Image.open(OUT / "mapa-santos-beatos.jpg")
bw, bh = book.size
print("book infographic", bw, bh)
# title ~10% top; map is left ~28%
mapa = book.crop((12, int(bh * 0.13), int(bw * 0.305), bh - 36))
mapa.save(OUT / "mapa-santos-solo.jpg", quality=92)
print("mapa-santos-solo", mapa.size)
