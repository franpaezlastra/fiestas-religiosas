import galeria from "../data/galeria.json" with { type: "json" };
import { optimizeCloudinaryUrl } from "./celebrationsAdapter";

const MAPA = galeria;

export function paginasGaleria(id) {
  return MAPA[String(id)] ?? [];
}

/** Fotos locales del libro (páginas escaneadas), fallback si no hay media en API */
export function fotosLocalesDe(id) {
  if (id == null || id === "") return [];
  return paginasGaleria(id).map((p) => `/images/galeria/p${String(p).padStart(3, "0")}.jpg`);
}

/**
 * Preferí fotos del API (Cloudinary) cuando la fiesta las trae;
 * si no, cae a galería local por número de libro (`numero`), no por uuid.
 */
export function fotosDe(fiestaOrId) {
  if (fiestaOrId && typeof fiestaOrId === "object") {
    if (Array.isArray(fiestaOrId.fotos) && fiestaOrId.fotos.length > 0) {
      return fiestaOrId.fotos;
    }
    return fotosLocalesDe(fiestaOrId.numero ?? fiestaOrId.id);
  }
  return fotosLocalesDe(fiestaOrId);
}

/** Solo media del API (images[] / primaryImage). Sin fallback local. */
export function fotosApiDe(fiesta) {
  if (fiesta && Array.isArray(fiesta.fotos) && fiesta.fotos.length > 0) {
    return fiesta.fotos;
  }
  return [];
}

export function tieneFotosApi(fiesta) {
  return Boolean(fotosApiDe(fiesta)[0]);
}

/** Portada del índice (optimizada para preview). */
export function fotoPortada(fiestaOrId) {
  const url = fotosApiDe(fiestaOrId)[0] ?? null;
  if (!url) return null;
  return optimizeCloudinaryUrl(url, 900);
}
