/** Helpers de la Comunidad: límites del contrato, validaciones, formato y referencias. */
import localFiestas from "../data/fiestas.json";
import { slugify } from "./slugify";

/* ---------- Límites (docs/COMUNIDAD_API_CONTRATO.md) ---------- */

export const LIMITES = {
  password: 10,
  usernameMin: 3,
  usernameMax: 30,
  displayNameMin: 2,
  displayNameMax: 60,
  bio: 300,
  titleMin: 5,
  titleMax: 120,
  bodyMin: 20,
  bodyMax: 10000,
  comment: 2000,
  reportDetails: 500,
  imagenes: 6,
  santos: 3,
  imagenBytes: 4 * 1024 * 1024,
  altMax: 200,
  edicionComentarioMin: 15,
};

export const EDAD_MINIMA = 13;

export const MOTIVOS_DENUNCIA = {
  SPAM: "Spam o publicidad",
  OFFENSIVE: "Contenido ofensivo",
  HATE: "Discurso de odio",
  DISRESPECTFUL_RELIGIOUS: "Falta de respeto a creencias religiosas",
  FALSE_INFO: "Información falsa",
  PERSONAL_DATA: "Datos personales de terceros",
  COPYRIGHT: "Fotos o textos de otra persona",
  OTHER: "Otro motivo",
};

export const ESTADOS_PUBLICACION = {
  PENDING: { label: "En revisión", tono: "pendiente" },
  PUBLISHED: { label: "Publicada", tono: "ok" },
  REJECTED: { label: "No aprobada", tono: "error" },
  REMOVED: { label: "Dada de baja", tono: "error" },
};

/* ---------- Validaciones (devuelven el mensaje de error o null) ---------- */

export function validarUsername(value) {
  const v = String(value || "").trim();
  if (!v) return "Elegí un nombre de usuario.";
  if (v.length < LIMITES.usernameMin || v.length > LIMITES.usernameMax) {
    return `Tiene que tener entre ${LIMITES.usernameMin} y ${LIMITES.usernameMax} caracteres.`;
  }
  if (!/^[a-z0-9-]+$/.test(v)) return "Solo minúsculas, números y guiones (sin espacios ni acentos).";
  if (/^-|-$/.test(v)) return "No puede empezar ni terminar con guion.";
  return null;
}

export function validarDisplayName(value) {
  const v = String(value || "").trim();
  if (v.length < LIMITES.displayNameMin) return "Escribí tu nombre (mínimo 2 caracteres).";
  if (v.length > LIMITES.displayNameMax) return `Máximo ${LIMITES.displayNameMax} caracteres.`;
  return null;
}

export function validarPassword(value) {
  const v = String(value || "");
  if (!v) return "La contraseña es obligatoria.";
  if (v.length < LIMITES.password) return `Tiene que tener al menos ${LIMITES.password} caracteres.`;
  return null;
}

/** 0 a 4, con etiqueta para el indicador de fuerza. */
export function fuerzaPassword(value) {
  const v = String(value || "");
  if (!v) return { nivel: 0, label: "" };
  let puntos = 0;
  if (v.length >= LIMITES.password) puntos += 1;
  if (v.length >= 14) puntos += 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) puntos += 1;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) puntos += 1;
  else if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) puntos += 0.5;
  if (v.length < LIMITES.password) puntos = Math.min(puntos, 1);
  const nivel = Math.max(1, Math.min(4, Math.round(puntos)));
  return { nivel, label: ["", "Débil", "Aceptable", "Buena", "Muy buena"][nivel] };
}

/** Sugiere un username a partir del nombre (para el registro). */
export function sugerirUsername(displayName) {
  return slugify(displayName).slice(0, LIMITES.usernameMax);
}

/* ---------- Formato ---------- */

const fechaLarga = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
const relativa = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

export function formatFechaLarga(iso) {
  return iso ? fechaLarga.format(new Date(iso)) : "";
}

/** "hace 5 minutos", "ayer", y la fecha completa después de una semana. */
export function formatHace(iso) {
  if (!iso) return "";
  const seg = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seg);
  if (abs < 60) return "recién";
  if (abs < 3600) return relativa.format(Math.round(seg / 60), "minute");
  if (abs < 86400) return relativa.format(Math.round(seg / 3600), "hour");
  if (abs < 7 * 86400) return relativa.format(Math.round(seg / 86400), "day");
  return formatFechaLarga(iso);
}

export function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

export function puedeEditarComentario(comment) {
  if (!comment?.isMine || comment.deleted) return false;
  return Date.now() - new Date(comment.createdAt).getTime() < LIMITES.edicionComentarioMin * 60000;
}

/** Mensaje para el usuario según el código de error del contrato. */
export function mensajeError(error, fallback = "Algo salió mal. Probá de nuevo.") {
  if (!error) return fallback;
  switch (error.code) {
    case "RATE_LIMITED": {
      const s = error.details?.retryAfterSeconds;
      return s
        ? `Esperá ${s >= 60 ? `${Math.ceil(s / 60)} min` : `${s} segundos`} antes de volver a intentarlo.`
        : "Esperá un momento antes de volver a intentarlo.";
    }
    case "EMAIL_NOT_VERIFIED":
      return "Confirmá tu email para poder publicar y comentar. Revisá tu casilla o pedí otro email desde el aviso.";
    case "ACCOUNT_SUSPENDED":
      return error.details?.until
        ? `Tu cuenta está suspendida hasta el ${formatFechaLarga(error.details.until)}.`
        : "Tu cuenta está suspendida.";
    case "CONTENT_BLOCKED":
      return "El texto tiene palabras que no están permitidas en la comunidad. Revisalo y probá de nuevo.";
    case "UNAUTHENTICATED":
      return "Tu sesión se cerró. Ingresá de nuevo para seguir.";
    case "NETWORK_ERROR":
      return "No hay conexión. Revisá internet y probá de nuevo.";
    default:
      return error.message || fallback;
  }
}

/** `details` de INVALID_REQUEST (issues de zod) → { campo: mensaje }. */
export function erroresDeCampos(error) {
  const issues = Array.isArray(error?.details) ? error.details : [];
  const out = {};
  for (const issue of issues) {
    const campo = Array.isArray(issue.path) ? issue.path[0] : null;
    if (campo && !out[campo]) out[campo] = issue.message;
  }
  return out;
}

/* ---------- Referencias (si la API pública no responde) ---------- */

/** Las fiestas del libro con el mismo slug que la API (`slugify(nombre)-id`). */
export const FIESTAS_REF = localFiestas.map((f) => ({
  id: `local-${f.id}`,
  slug: `${slugify(f.nombre)}-${f.id}`,
  nombre: f.nombre,
  provincia: f.provincia,
  provinciaSlug: null,
}));

export const PROVINCIAS_REF = [
  ["buenos-aires", "Buenos Aires"],
  ["caba", "Ciudad Autónoma de Buenos Aires"],
  ["catamarca", "Catamarca"],
  ["chaco", "Chaco"],
  ["chubut", "Chubut"],
  ["cordoba", "Córdoba"],
  ["corrientes", "Corrientes"],
  ["entre-rios", "Entre Ríos"],
  ["formosa", "Formosa"],
  ["jujuy", "Jujuy"],
  ["la-pampa", "La Pampa"],
  ["la-rioja", "La Rioja"],
  ["mendoza", "Mendoza"],
  ["misiones", "Misiones"],
  ["neuquen", "Neuquén"],
  ["rio-negro", "Río Negro"],
  ["salta", "Salta"],
  ["san-juan", "San Juan"],
  ["san-luis", "San Luis"],
  ["santa-cruz", "Santa Cruz"],
  ["santa-fe", "Santa Fe"],
  ["santiago-del-estero", "Santiago del Estero"],
  ["tierra-del-fuego", "Tierra del Fuego"],
  ["tucuman", "Tucumán"],
].map(([slug, name]) => ({ slug, name }));

export const SANTOS_REF = [
  ["santa-nazaria-ignacia-march-1", "Santa Nazaria Ignacia March"],
  ["laura-vicuna-2", "Laura Vicuña"],
  ["ceferino-namuncura-3", "Ceferino Namuncurá"],
  ["san-jose-gabriel-brochero-4", "San José Gabriel Brochero"],
  ["santa-ma-antonia-de-paz-y-figueroa-5", "Santa Ma. Antonia de Paz y Figueroa"],
  ["san-artemides-zatti-6", "San Artémides Zatti"],
  ["fray-mamerto-esquiu-7", "Fray Mamerto Esquiú"],
  ["san-hector-valdivielso-saez-8", "San Héctor Valdivielso Sáez"],
  ["wenceslao-pedernera-9", "Wenceslao Pedernera"],
  ["mons-enrique-angelelli-10", "Mons. Enrique Angelelli"],
  ["maria-del-transito-cabanillas-11", "María del Tránsito Cabanillas"],
  ["eduardo-francisco-pironio-12", "Eduardo Francisco Pironio"],
  ["maria-crescencia-perez-13", "María Crescencia Pérez"],
  ["catalina-de-maria-rodriguez-14", "Catalina de María Rodríguez"],
  ["enrique-ernesto-shaw-15", "Enrique Ernesto Shaw"],
  ["coronel-argentino-del-valle-larrabure-16", "Coronel Argentino del Valle Larrabure"],
].map(([slug, name]) => ({ slug, name }));

export function provinciaSlugDeNombre(nombre) {
  const n = slugify(nombre);
  return PROVINCIAS_REF.find((p) => slugify(p.name) === n || p.slug === n)?.slug || null;
}

export const BORRADOR_KEY = "fr-borrador-publicacion";
