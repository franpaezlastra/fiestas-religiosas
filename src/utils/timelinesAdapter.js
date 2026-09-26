import { ANIOS_PAPADO } from "../data/bergoglio";
import { optimizeCloudinaryUrl } from "./celebrationsAdapter";
import { cloudinaryUploadUrl, normalizeCloudinaryUrl } from "./cloudinary";

function eventImageUrl(image) {
  const media = image?.media || image;
  if (!media) return null;
  let url = null;
  if (media.url) url = normalizeCloudinaryUrl(media.url);
  else if (media.storageKey) url = cloudinaryUploadUrl(media.storageKey);
  return optimizeCloudinaryUrl(url, 720);
}

function primaryEventImage(event) {
  const rows = Array.isArray(event?.images) ? event.images : [];
  if (rows.length === 0) return null;
  return (
    [...rows].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    })[0] || null
  );
}

function fotoFormaFromImage(image) {
  const role = String(image?.imageRole || image?.imageKind || "").toUpperCase();
  if (role === "LOGO") return "logo";
  if (role === "PORTRAIT") return "retrato";
  const caption = String(
    image?.translation?.caption ||
      image?.translations?.find((t) => t.locale === "es")?.caption ||
      "",
  ).toLowerCase();
  if (caption.includes("logo")) return "logo";
  return "retrato";
}

function destacadoFromEvent(event) {
  const h = String(event?.highlight || "").toUpperCase();
  if (h === "ELECTION" || h === "ELECCION") return "eleccion";
  if (h === "PASSING" || h === "PARTIDA") return "partida";
  return undefined;
}

/**
 * Evento de timeline API → hito de LineaTiempo.
 * foto: events[].images (media.url / storageKey).
 */
export function eventToHito(event, index = 0) {
  const tr =
    event.translation ||
    event.translations?.find((t) => t.locale === "es") ||
    event.translations?.[0];
  const start = event.startDate ? String(event.startDate).slice(0, 10) : "";
  const anio = start ? Number(start.slice(0, 4)) : 0;
  const marca =
    tr?.axisLabel || tr?.dateDescription || String(anio) || String(index + 1);
  const fecha = tr?.dateLabel || tr?.dateDescription || "";
  const description = tr?.description || "";
  const place = event.place || tr?.place || "";
  let lugar = place;
  let texto = description;
  if (!lugar && description.includes(" — ")) {
    const [first, ...rest] = description.split(" — ");
    lugar = first;
    texto = rest.join(" — ");
  }

  const img = primaryEventImage(event);
  const imgTr =
    img?.translation ||
    img?.translations?.find((t) => t.locale === "es") ||
    img?.translations?.[0];

  const hito = {
    id: `evt-${event.id || index}`,
    anio,
    marca,
    fecha,
    lugar,
    titulo: tr?.title || "Sin título",
    texto,
  };

  const foto = eventImageUrl(img);
  if (foto) {
    hito.foto = foto;
    hito.fotoAlt = imgTr?.altText || imgTr?.caption || "";
    hito.fotoForma = fotoFormaFromImage(img);
  }

  const destacado = destacadoFromEvent(event);
  if (destacado) hito.destacado = destacado;

  return hito;
}

export function selectFranciscoTimelines(publicItems) {
  const list = Array.isArray(publicItems) ? publicItems : [];
  const argentina = list.find((t) => t.code === "FRANCISCO_ARGENTINA");
  const papado = list.find((t) => t.code === "FRANCISCO_PAPADO");

  const mapEvents = (tl) =>
    [...(tl?.events || [])]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((e, i) => eventToHito(e, i));

  return {
    source: "api",
    argentina: mapEvents(argentina),
    papado: mapEvents(papado),
    aniosPapado: ANIOS_PAPADO,
  };
}
