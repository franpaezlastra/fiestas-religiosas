import { optimizeCloudinaryUrl } from "./celebrationsAdapter";

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

/** Alias: solo fotos del API. */
export function fotosDe(fiestaOrId) {
  if (fiestaOrId && typeof fiestaOrId === "object") {
    return fotosApiDe(fiestaOrId);
  }
  return [];
}

/** Portada del índice (optimizada para preview). */
export function fotoPortada(fiestaOrId) {
  const url = fotosApiDe(fiestaOrId)[0] ?? null;
  if (!url) return null;
  return optimizeCloudinaryUrl(url, 900);
}
