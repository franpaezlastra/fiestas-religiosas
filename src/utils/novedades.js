/** Helpers de las Novedades del libro: un blog de noticias (presentaciones, muestras, prensa). */

export const TIPOS_NOVEDAD = {
  PRESENTATION: "Presentación",
  EXHIBITION: "Muestra",
  PRESS: "Prensa",
  OTHER: "Novedad",
};

export const LIMITES_NOVEDAD = {
  titleMin: 5,
  titleMax: 120,
  summaryMax: 280,
  bodyMax: 10000,
  imagenes: 12,
};

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** La más reciente primero. */
export function ordenarNovedades(items = []) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

export function formatFechaNovedad(novedad) {
  if (!novedad?.date) return "";
  const [y, m, d] = String(novedad.date).split("-").map(Number);
  return fechaCorta.format(new Date(y, m - 1, d));
}

export function lugarNovedad(novedad) {
  const provincia = novedad?.province?.name;
  /* "Salta, Salta" → "Salta" cuando la ciudad se llama igual que la provincia */
  const repetida = provincia && novedad?.city && provincia.toLowerCase() === novedad.city.toLowerCase();
  return [novedad?.place, novedad?.city, repetida ? null : provincia].filter(Boolean).join(", ");
}
