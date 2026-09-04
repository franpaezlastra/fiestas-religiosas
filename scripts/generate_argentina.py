"""Download ARG.geo.json, simplify, project, emit SVG path constants."""
import json
import urllib.request
from pathlib import Path

from shapely.geometry import shape, mapping, Polygon, MultiPolygon

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "src" / "data" / "argentina-paths.json"
CACHE = ROOT / "scripts" / "ARG.geo.json"
URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/ARG.geo.json"

WIDTH, HEIGHT, PAD = 420, 780, 18
# Full country bounds (continental + Tierra del Fuego)
MINLON, MAXLON = -73.56, -53.63
MINLAT, MAXLAT = -55.25, -21.78


def project(lon, lat):
    scale = min((WIDTH - 2 * PAD) / (MAXLON - MINLON), (HEIGHT - 2 * PAD) / (MAXLAT - MINLAT))
    offx = PAD + ((WIDTH - 2 * PAD) - (MAXLON - MINLON) * scale) / 2
    offy = PAD + ((HEIGHT - 2 * PAD) - (MAXLAT - MINLAT) * scale) / 2
    return (
        round(offx + (lon - MINLON) * scale, 2),
        round(offy + (MAXLAT - lat) * scale, 2),
    )


def ring_to_d(coords):
    parts = []
    for i, (lon, lat) in enumerate(coords):
        x, y = project(lon, lat)
        parts.append(f"{'M' if i == 0 else 'L'}{x} {y}")
    parts.append("Z")
    return " ".join(parts)


def geom_to_d(geom):
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    return " ".join(ring_to_d(p.exterior.coords) for p in polys)


if not CACHE.exists():
    print("Downloading ARG.geo.json...")
    req = urllib.request.Request(URL, headers={"User-Agent": "PeregrinosWeb/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        CACHE.write_bytes(r.read())

data = json.loads(CACHE.read_text(encoding="utf-8"))
geom = shape(data["features"][0]["geometry"])
polys = sorted(list(geom.geoms), key=lambda p: p.area, reverse=True)

print(f"polygons={len(polys)} areas={[round(p.area, 3) for p in polys[:8]]}")

mainland = polys[0].simplify(0.08, preserve_topology=True)
# Tierra del Fuego + nearby large islands (skip tiny islets)
islands = [p.simplify(0.05, preserve_topology=True) for p in polys[1:] if p.area > 0.15]
tdf = islands[0] if islands else None

payload = {
    "viewBox": f"0 0 {WIDTH} {HEIGHT}",
    "width": WIDTH,
    "height": HEIGHT,
    "pad": PAD,
    "bounds": {
        "minlon": MINLON,
        "maxlon": MAXLON,
        "minlat": MINLAT,
        "maxlat": MAXLAT,
    },
    "mainland": geom_to_d(mainland),
    "tierraDelFuego": geom_to_d(tdf) if tdf else "",
    "islands": [geom_to_d(p) for p in islands[1:3]],
}

OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
print(f"wrote {OUT_JSON} mainland_len={len(payload['mainland'])} tdf_len={len(payload['tierraDelFuego'])}")
