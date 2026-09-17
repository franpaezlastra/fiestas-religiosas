import localFiestas from "../data/fiestas.json";

const LEGACY_RE = /legacyId:(\d+)/i;

/** Índice local por id para enriquecer campos que el API aún no tiene */
const localById = new Map(localFiestas.map((f) => [f.id, f]));

export function parseLegacyId(shortDescription) {
  const m = String(shortDescription || "").match(LEGACY_RE);
  return m ? Number(m[1]) : null;
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

function mediaUrl(image) {
  const media = image?.media;
  if (!media) return null;
  if (media.url) return media.url;
  if (media.storageKey) {
    const cloud =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duuwqmpmn";
    return `https://res.cloudinary.com/${cloud}/image/upload/${media.storageKey}`;
  }
  return null;
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
  if (local?.mes != null) return local.mes;
  if (schedule?.startMonth != null) return Number(schedule.startMonth);
  if (schedule?.startDate) {
    const d = new Date(schedule.startDate);
    if (!Number.isNaN(d.getTime())) return d.getUTCMonth() + 1;
  }
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
 * Conserva region/capitulo/enLibro/paginas desde fiestas.json cuando hay legacyId.
 */
export function celebrationToFiesta(item) {
  const tr = translationOf(item);
  const schedule = scheduleOf(item);
  const scheduleTr = scheduleTranslation(schedule);
  const legacyId = parseLegacyId(tr?.shortDescription);
  const local = legacyId != null ? localById.get(legacyId) : null;

  const sortedImages = [...(item.images || [])].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
  const fotos = sortedImages.map(mediaUrl).filter(Boolean);

  const id = legacyId ?? local?.id ?? item.displayOrder ?? item.id;

  return {
    id,
    apiId: item.id,
    nombre: tr?.name || local?.nombre || "Sin nombre",
    lugar: item.locality || item.placeName || local?.lugar || "",
    provincia: item.province?.name || local?.provincia || "",
    region: local?.region || null,
    fecha: scheduleTr?.dateDescription || local?.fecha || "",
    fechaISO_referencia: fechaIsoFromSchedule(schedule, local),
    mes: mesFromSchedule(schedule, local),
    tipo: tipoFromSchedule(schedule, local),
    capitulo: local?.capitulo ?? null,
    paginas: local?.paginas ?? null,
    lat: item.latitude != null ? Number(item.latitude) : local?.lat ?? null,
    lng: item.longitude != null ? Number(item.longitude) : local?.lng ?? null,
    enLibro: local?.enLibro ?? true,
    showOnMap: item.showOnMap !== false,
    fotos,
    source: "api",
  };
}

function sortByLegacyId(a, b) {
  const na = Number(a.id);
  const nb = Number(b.id);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a.nombre).localeCompare(String(b.nombre), "es");
}

/**
 * Datos del mapa/calendario.
 * Prioridad: API pública (`GET /public/celebrations`). El mock local solo si la API
 * viene vacía o falló. No usamos `/admin/celebrations` acá (requiere sesión).
 */
export function selectFiestasForUi({ publicItems, localItems, source }) {
  if (Array.isArray(publicItems) && publicItems.length > 0) {
    return publicItems
      .map(celebrationToFiesta)
      .filter((f) => typeof f.id === "number" || /^\d+$/.test(String(f.id)))
      .sort(sortByLegacyId);
  }
  if (source === "api") return [];
  return (localItems || localFiestas).map((f) => ({
    ...f,
    fotos: null,
    apiId: null,
    source: "local",
  }));
}
