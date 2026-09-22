import localFiestas from "../data/fiestas.json";

const LEGACY_RE = /legacyId:(\d+)/i;

/** Índice local por id para enriquecer campos que el API aún no tiene */
const localById = new Map(localFiestas.map((f) => [f.id, f]));

export function parseLegacyId(shortDescription) {
  const m = String(shortDescription || "").match(LEGACY_RE);
  return m ? Number(m[1]) : null;
}

/** Limpia tags de seed (legacyId:N) que no deben mostrarse como copy. */
export function cleanLegacyTag(text) {
  return String(text || "")
    .replace(/legacyId:\s*\d+/gi, "")
    .replace(/legacySantosId:\s*\d+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Relación libro ↔ celebración (API: books[] / bookAssociations[]).
 * Prisma BookCelebration: mapNumber, chapterNumber, pageReference.
 */
export function celebrationBookLink(item) {
  const rows = item?.books || item?.bookAssociations || [];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const am = a.mapNumber ?? a.displayNumber ?? 9999;
    const bm = b.mapNumber ?? b.displayNumber ?? 9999;
    return Number(am) - Number(bm);
  })[0];
}

/** Número visible en pin/lista (libro). La identidad React es `id`. */
export function fiestaNumero(f) {
  if (f?.numero != null && f.numero !== "") return f.numero;
  return f?.id;
}

function translationOf(item) {
  return (
    item?.translation ||
    item?.translations?.find((t) => t.locale === "es") ||
    item?.translations?.[0] ||
    null
  );
}

function scheduleOf(item) {
  return item?.schedules?.[0] || null;
}

function scheduleTranslation(schedule) {
  return (
    schedule?.translation ||
    schedule?.translations?.find((t) => t.locale === "es") ||
    schedule?.translations?.[0] ||
    null
  );
}

function mediaUrl(image, { maxWidth } = {}) {
  const media = image?.media;
  if (!media) return null;

  let url = null;
  if (media.url) url = media.url;
  else if (media.storageKey) {
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duuwqmpmn";
    url = `https://res.cloudinary.com/${cloud}/image/upload/${media.storageKey}`;
  }
  if (!url) return null;
  return optimizeCloudinaryUrl(url, maxWidth);
}

/** Seeds del API (`_placeholder_seed.webp`, ~1 KB azul) — no son fotos reales. */
export function isPlaceholderImage(image) {
  const media = image?.media;
  if (!media) return true;
  const name = String(media.originalFilename || "");
  const key = String(media.storageKey || "");
  if (/placeholder/i.test(name) || /placeholder/i.test(key)) return true;
  // archivos minúsculos del seed
  if (typeof media.sizeBytes === "number" && media.sizeBytes > 0 && media.sizeBytes < 5000) {
    return true;
  }
  return false;
}

/** Reduce peso de previews/álbum; el original sigue disponible sin maxWidth. */
export function optimizeCloudinaryUrl(url, maxWidth) {
  if (!url || !maxWidth) return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/(?:[^/]+,)*w_/.test(url)) return url;
  return url.replace("/upload/", `/upload/c_limit,w_${maxWidth},q_auto,f_auto/`);
}

/** Lista pública puede traer `primaryImage` o `images[]` según deploy. */
export function celebrationImageUrls(item, { maxWidth } = {}) {
  const raw =
    Array.isArray(item?.images) && item.images.length > 0
      ? item.images
      : item?.primaryImage
        ? [item.primaryImage]
        : [];
  return [...raw]
    .filter((img) => !isPlaceholderImage(img))
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    })
    .map((img) => mediaUrl(img, { maxWidth }))
    .filter(Boolean);
}

/** Filtra placeholders en un array crudo de CelebrationImage. */
export function filterRealImages(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((img) => !isPlaceholderImage(img));
}

function tipoFromSchedule(schedule, local) {
  if (local?.tipo) return local.tipo;
  const t = schedule?.scheduleType;
  if (t === "FIXED_ANNUAL" || t === "ANNUAL_RANGE") return "fija";
  if (t === "YEAR_ROUND") return local?.tipo === "nacional" ? "nacional" : "movil";
  if (t === "VARIABLE_ANNUAL" || t === "ONE_TIME") return "movil";
  return "fija";
}

function mesFromSchedule(schedule, local) {
  // Prioridad: schedule del API (startMonth / startDate), después mock local
  if (schedule?.startMonth != null) return Number(schedule.startMonth);
  if (schedule?.startDate) {
    const d = new Date(schedule.startDate);
    if (!Number.isNaN(d.getTime())) return d.getUTCMonth() + 1;
  }
  if (local?.mes != null) return local.mes;
  return null;
}

function fechaIsoFromSchedule(schedule, local) {
  if (local?.fechaISO_referencia) return local.fechaISO_referencia;
  if (schedule?.startMonth != null && schedule?.startDay != null) {
    return `--${String(schedule.startMonth).padStart(2, "0")}-${String(schedule.startDay).padStart(2, "0")}`;
  }
  return null;
}

/**
 * Convierte una celebración pública del API al shape del mapa/calendario.
 * Número de fiesta: books[].mapNumber → bookNumber → displayOrder.
 * No usar shortDescription (ahí el seed metía legacyId:N).
 */
export function celebrationToFiesta(item) {
  const tr = translationOf(item);
  const schedule = scheduleOf(item);
  const scheduleTr = scheduleTranslation(schedule);
  const book = celebrationBookLink(item);

  const numero =
    (book?.mapNumber != null ? Number(book.mapNumber) : null) ??
    (book?.displayNumber != null ? Number(book.displayNumber) : null) ??
    (typeof item.bookNumber === "number" ? item.bookNumber : null) ??
    (typeof item.displayOrder === "number" ? item.displayOrder : null) ??
    null;

  // Mock local solo para campos que el API todavía no manda (región, tipo fino, etc.)
  const legacyId = parseLegacyId(tr?.shortDescription);
  const local =
    (numero != null ? localById.get(Number(numero)) : null) ||
    (legacyId != null ? localById.get(legacyId) : null) ||
    null;

  const fotos = celebrationImageUrls(item, { maxWidth: 640 });

  const capitulo =
    book?.chapterNumber ?? item.bookChapter ?? local?.capitulo ?? null;
  const paginas =
    book?.pageReference ?? item.bookPages ?? local?.paginas ?? null;

  return {
    id: item.id,
    apiId: item.id,
    numero,
    nombre: tr?.name || local?.nombre || "Sin nombre",
    lugar: item.locality || item.placeName || local?.lugar || "",
    provincia: item.province?.name || local?.provincia || "",
    provinceId: item.province?.id || null,
    region: item.region || local?.region || null,
    fecha: scheduleTr?.dateDescription || local?.fecha || "",
    fechaISO_referencia: fechaIsoFromSchedule(schedule, local),
    mes: mesFromSchedule(schedule, local),
    tipo: item.mapKind || tipoFromSchedule(schedule, local),
    capitulo,
    paginas,
    lat: item.latitude != null ? Number(item.latitude) : local?.lat ?? null,
    lng: item.longitude != null ? Number(item.longitude) : local?.lng ?? null,
    enLibro: item.inBook ?? (book != null ? true : local?.enLibro ?? true),
    showOnMap: item.showOnMap !== false,
    bookId: book?.bookId || book?.book?.id || null,
    fotos,
    source: "api",
  };
}

function sortByNumero(a, b) {
  const na = Number(a.numero);
  const nb = Number(b.numero);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  if (Number.isFinite(na) && !Number.isFinite(nb)) return -1;
  if (!Number.isFinite(na) && Number.isFinite(nb)) return 1;
  return String(a.nombre).localeCompare(String(b.nombre), "es");
}

/**
 * Datos del mapa/calendario.
 * Prioridad: API pública. Mock local solo si la API viene vacía o falló.
 */
export function selectFiestasForUi({ publicItems, localItems, source }) {
  if (Array.isArray(publicItems) && publicItems.length > 0) {
    return publicItems.map(celebrationToFiesta).sort(sortByNumero);
  }
  if (source === "api") return [];
  return (localItems || localFiestas).map((f) => ({
    ...f,
    numero: f.id,
    fotos: null,
    apiId: null,
    source: "local",
  }));
}
