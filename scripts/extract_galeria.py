"""Parse book index (pp. 292-294) → galeria.json + JPEG pages."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Peregrinos final en baja.pdf"
FIESTAS = ROOT / "src" / "data" / "fiestas.json"
OUT_JSON = ROOT / "src" / "data" / "galeria.json"
OUT_IMG = ROOT / "public" / "images" / "galeria"
OUT_IMG.mkdir(parents=True, exist_ok=True)


def parse_paginas(cell: str) -> list[int]:
    raw = (cell or "").replace("\n", " ").strip()
    raw = raw.replace("–", "-").replace("—", "-")
    if not raw:
        return []
    nums: list[int] = []
    # "266 a 273" / "12 a 29"
    for m in re.finditer(r"(\d+)\s*a\s*(\d+)", raw, re.I):
        a, b = int(m.group(1)), int(m.group(2))
        lo, hi = min(a, b), max(a, b)
        nums.extend(range(lo, hi + 1))
        raw = raw[: m.start()] + " " + raw[m.end() :]
    for m in re.finditer(r"\d+", raw):
        n = int(m.group(0))
        if 1 <= n <= 324:
            nums.append(n)
    seen: set[int] = set()
    out: list[int] = []
    for n in nums:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


doc = pymupdf.open(PDF)
galeria: dict[str, list[int]] = {}
paginas_cell: dict[str, str] = {}

for n in (292, 293, 294):
    page = doc[n - 1]
    tabs = page.find_tables()
    if not tabs.tables:
        continue
    rows = tabs.tables[0].extract()
    for row in rows:
        if not row or len(row) < 9:
            continue
        id_cell = (row[2] or "").strip()
        if not id_cell.isdigit():
            continue
        fid = str(int(id_cell))
        pages = parse_paginas(row[8] or "")
        if not pages:
            continue
        galeria[fid] = pages
        paginas_cell[fid] = re.sub(r"\s+", " ", (row[8] or "").strip())

fiestas = json.loads(FIESTAS.read_text(encoding="utf-8"))
for f in fiestas:
    fid = str(f["id"])
    if fid in paginas_cell:
        f["paginas"] = paginas_cell[fid]
FIESTAS.write_text(json.dumps(fiestas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

OUT_JSON.write_text(json.dumps(galeria, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("fiestas con galería", len(galeria))

needed = sorted({p for pages in galeria.values() for p in pages})
print("páginas únicas", len(needed), "min", needed[0], "max", needed[-1])

zoom = pymupdf.Matrix(1.25, 1.25)
for i, num in enumerate(needed, start=1):
    dest = OUT_IMG / f"p{num:03d}.jpg"
    if dest.exists() and dest.stat().st_size > 8000:
        continue
    pix = doc[num - 1].get_pixmap(matrix=zoom, alpha=False)
    pix.save(dest.as_posix(), output="jpeg", jpg_quality=76)
    if i % 20 == 0 or i == len(needed):
        print(f"extracted {i}/{len(needed)} p{num:03d}.jpg")

doc.close()
print("done", OUT_IMG)
