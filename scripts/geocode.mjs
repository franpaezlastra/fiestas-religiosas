/**
 * One-shot geocoder. Reads src/data/fiestas.json, fills lat/lng via Nominatim.
 * Rate limit: 1 req/sec. User-Agent required by OSM usage policy.
 *
 *   node scripts/geocode.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "src", "data", "fiestas.json");
const UA = "PeregrinosWeb/1.0 (fiestas populares argentinas; contacto: local-dev)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function queryFor(f) {
  if (f.tipo === "nacional") return null;
  const lugar = (f.lugar || "").trim();
  if (!lugar || lugar === "Argentina" || lugar === "Norte argentino") return null;
  const provincia = f.provincia === "CABA" ? "Ciudad Autónoma de Buenos Aires" : f.provincia;
  return `${lugar}, ${provincia}, Argentina`;
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ar`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for ${q}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), display: data[0].display_name };
}

const MANUAL = {
  "Villa Silípica|Santiago del Estero": { lat: -28.1167, lng: -64.3833 },
  "Sumamao|Santiago del Estero": { lat: -27.9833, lng: -64.2167 },
  "Huachana|Santiago del Estero": { lat: -27.55, lng: -64.85 },
  "Mailín|Santiago del Estero": { lat: -28.4833, lng: -63.2833 },
  "Tastil|Salta": { lat: -24.45, lng: -65.95 },
  "Casabindo|Jujuy": { lat: -22.75, lng: -65.9833 },
  "Villa Hondo|Santiago del Estero": { lat: -26.2333, lng: -65.2833 },
  "La Reducción|Tucumán": { lat: -26.8667, lng: -65.35 },
  "El Mollar|Tucumán": { lat: -26.9333, lng: -65.7 },
  "Villa de la Quebrada|San Luis": { lat: -33.3, lng: -66.2833 },
  "Renca|San Luis": { lat: -32.7667, lng: -65.3667 },
  "Villa Reducción|Córdoba": { lat: -33.201, lng: -63.862 },
  "Carrodilla|Mendoza": { lat: -32.9833, lng: -68.85 },
  "Santa Cruz de los Milagros|Corrientes": { lat: -29.35, lng: -58.0 },
  "Piedra Blanca|Catamarca": { lat: -28.39, lng: -65.77 },
  "Uquía|Jujuy": { lat: -23.304, lng: -65.356 },
  "Yavi|Jujuy": { lat: -22.129, lng: -65.464 },
  "Huacalera|Jujuy": { lat: -23.439, lng: -65.351 },
};

const fiestas = JSON.parse(await readFile(FILE, "utf8"));
const cache = new Map();
const missing = [];

for (const f of fiestas) {
  if (f.tipo === "nacional") {
    f.lat = null;
    f.lng = null;
    continue;
  }
  const key = `${f.lugar}|${f.provincia}`;
  if (MANUAL[key]) {
    f.lat = MANUAL[key].lat;
    f.lng = MANUAL[key].lng;
    cache.set(key, MANUAL[key]);
    console.log(`manual  #${f.id} ${key}`);
    continue;
  }
  if (cache.has(key)) {
    const c = cache.get(key);
    f.lat = c.lat;
    f.lng = c.lng;
    continue;
  }
  const q = queryFor(f);
  if (!q) {
    missing.push(f);
    continue;
  }
  try {
    const hit = await nominatim(q);
    await sleep(1100);
    if (!hit) {
      console.warn(`MISS    #${f.id} ${q}`);
      missing.push(f);
      cache.set(key, { lat: null, lng: null });
      continue;
    }
    console.log(`ok      #${f.id} ${q} -> ${hit.lat.toFixed(4)}, ${hit.lng.toFixed(4)} (${hit.display})`);
    cache.set(key, hit);
    f.lat = hit.lat;
    f.lng = hit.lng;
  } catch (err) {
    console.error(`ERR     #${f.id} ${q}`, err.message);
    missing.push(f);
    await sleep(1100);
  }
}

await writeFile(FILE, JSON.stringify(fiestas, null, 2) + "\n", "utf8");
console.log(`\nSaved ${FILE}`);
console.log(`Missing: ${missing.map((f) => `#${f.id} ${f.lugar}`).join(", ") || "none"}`);
