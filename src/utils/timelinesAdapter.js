import { ANIOS_PAPADO, HITOS_ARGENTINA, HITOS_PAPADO } from "../data/bergoglio";

/**
 * Evento de timeline API → hito de LineaTiempo.
 */
export function eventToHito(event, index = 0) {
  const tr =
    event.translation ||
    event.translations?.find((t) => t.locale === "es") ||
    event.translations?.[0];
  const start = event.startDate ? String(event.startDate).slice(0, 10) : "";
  const anio = start ? Number(start.slice(0, 4)) : 0;
  const marca = tr?.dateDescription || String(anio) || String(index + 1);
  const description = tr?.description || "";
  const [lugar, ...rest] = description.split(" — ");
  const texto = rest.length ? rest.join(" — ") : description;

  return {
    id: `evt-${event.id || index}`,
    anio,
    marca,
    fecha: tr?.dateDescription || "",
    lugar: rest.length ? lugar : "",
    titulo: tr?.title || "Sin título",
    texto: rest.length ? texto : description,
  };
}

export function selectFranciscoTimelines(publicItems) {
  const list = Array.isArray(publicItems) ? publicItems : [];
  const argentina = list.find((t) => t.code === "FRANCISCO_ARGENTINA");
  const papado = list.find((t) => t.code === "FRANCISCO_PAPADO");

  if (!argentina && !papado) {
    return {
      source: "local",
      argentina: HITOS_ARGENTINA,
      papado: HITOS_PAPADO,
      aniosPapado: ANIOS_PAPADO,
    };
  }

  const mapEvents = (tl) =>
    [...(tl?.events || [])]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((e, i) => eventToHito(e, i));

  const argentinaEvents = mapEvents(argentina);
  const papadoEvents = mapEvents(papado);

  return {
    source: "api",
    argentina: argentinaEvents.length ? argentinaEvents : HITOS_ARGENTINA,
    papado: papadoEvents.length ? papadoEvents : HITOS_PAPADO,
    aniosPapado: ANIOS_PAPADO,
  };
}
