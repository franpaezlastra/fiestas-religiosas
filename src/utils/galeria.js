import galeria from "../data/galeria.json" with { type: "json" };

const MAPA = galeria;

export function paginasGaleria(id) {
  return MAPA[String(id)] ?? [];
}

/** Fotos locales del libro (páginas escaneadas), fallback si no hay media en API */
export function fotosLocalesDe(id) {
  return paginasGaleria(id).map((p) => `/images/galeria/p${String(p).padStart(3, "0")}.jpg`);
}

/**
 * Preferí fotos del API (Cloudinary) cuando la fiesta las trae;
 * si no, cae a galería local por id.
 */
export function fotosDe(fiestaOrId) {
  if (fiestaOrId && typeof fiestaOrId === "object") {
    if (Array.isArray(fiestaOrId.fotos) && fiestaOrId.fotos.length > 0) {
      return fiestaOrId.fotos;
    }
    return fotosLocalesDe(fiestaOrId.id);
  }
  return fotosLocalesDe(fiestaOrId);
}

export function fotoPortada(fiestaOrId) {
  return fotosDe(fiestaOrId)[0] ?? null;
}
