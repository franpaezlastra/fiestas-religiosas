import { SANTOS_BEATOS } from "../data/santos";
import { cleanLegacyTag, optimizeCloudinaryUrl } from "./celebrationsAdapter";

const LOCAL_BY_ID = new Map(SANTOS_BEATOS.map((s) => [s.id, s]));

const STAGE_TO_CATEGORIA = {
  SAINT: "santo",
  BLESSED: "beato",
  VENERABLE: "siervo",
  SERVANT_OF_GOD: "siervo",
  PRE_CAUSE: "siervo",
};

const ROLE_TO_CATEGORIA = {
  SAINT: "santo",
  BLESSED: "beato",
  FEATURED_PERSON: "siervo",
};

/**
 * Relación libro ↔ persona (API: bookAppearances[] / bookAssociations[] / books[]).
 * Nº del mapa de santos = displayNumber.
 */
export function personBookLink(person) {
  const rows =
    person?.bookAppearances || person?.bookAssociations || person?.books || [];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const am = a.displayNumber ?? a.mapNumber ?? 9999;
    const bm = b.displayNumber ?? b.mapNumber ?? 9999;
    return Number(am) - Number(bm);
  })[0];
}

function displayNumberOf(person, index) {
  const book = personBookLink(person);
  if (book?.displayNumber != null) return Number(book.displayNumber);
  if (book?.mapNumber != null) return Number(book.mapNumber);
  // No usar featuredDisplayOrder acá: eso es orden de /tres-argentinos, no del mapa de santos
  if (person.roles?.[0]?.displayOrder != null) return Number(person.roles[0].displayOrder);
  // Último recurso: tag de seed en shortBio (no debería usarse si el libro está linkeado)
  const tr =
    person.translation ||
    person.translations?.find((t) => t.locale === "es") ||
    person.translations?.[0];
  const legacy = String(tr?.shortBio || "").match(/legacySantosId:(\d+)/i);
  if (legacy) return Number(legacy[1]);
  return index + 1;
}

/**
 * Persona pública API → shape de SeccionSantos.
 * Número: bookAppearances.displayNumber (no shortBio).
 */
export function personToSanto(person, index = 0) {
  const tr =
    person.translation ||
    person.translations?.find((t) => t.locale === "es") ||
    person.translations?.[0];
  const book = personBookLink(person);
  const id = displayNumberOf(person, index);
  const local = LOCAL_BY_ID.get(id);

  let categoria = local?.categoria || "beato";
  if (person.canonizationStage && STAGE_TO_CATEGORIA[person.canonizationStage]) {
    categoria = STAGE_TO_CATEGORIA[person.canonizationStage];
  } else {
    const role = person.roles?.[0]?.role;
    if (role && ROLE_TO_CATEGORIA[role]) categoria = ROLE_TO_CATEGORIA[role];
  }

  const birth = person.birthDate ? String(person.birthDate).slice(0, 4) : "";
  const death = person.deathDate ? String(person.deathDate).slice(0, 4) : "";
  const anios =
    birth && death ? `${birth}-${death}` : birth ? `${birth}-` : local?.anios || "";

  const shortBio = cleanLegacyTag(tr?.shortBio);
  const biography = cleanLegacyTag(tr?.biography);

  return {
    id,
    apiId: person.id,
    nombre: tr?.displayName || local?.nombre || "Sin nombre",
    anios,
    categoria,
    lugar: tr?.birthPlace || local?.lugar || "",
    provincia: local?.provincia || "",
    bio: biography || shortBio || local?.bio || "",
    bookId: book?.bookId || book?.book?.id || null,
    chapterNumber: book?.chapterNumber ?? null,
    pageReference: book?.pageReference || null,
    source: "api",
  };
}

/** Destacados culturales (Maradona/Messi/…) — van a /tres-argentinos, no a /santos. */
export function isFeaturedOnly(person) {
  if (!person) return false;
  if (person.canonizationStage) return false;
  const roles = (person.roles || []).map((r) => r.role);
  if (roles.some((r) => ["SAINT", "BLESSED"].includes(r))) return false;
  if (person.isFeatured) return true;
  const tr =
    person.translation ||
    person.translations?.find((t) => t.locale === "es") ||
    person.translations?.[0];
  const slug = String(tr?.slug || "");
  return /^(diego-maradona|papa-francisco|lionel-messi)/i.test(slug);
}

function isSantosCandidate(p) {
  if (isFeaturedOnly(p)) return false;
  if (p.canonizationStage) return true;
  const roles = (p.roles || []).map((r) => r.role);
  if (roles.some((r) => ["SAINT", "BLESSED"].includes(r))) return true;
  // Siervos viejos (FEATURED_PERSON) sin isFeatured
  if (roles.includes("FEATURED_PERSON") && !p.isFeatured) return true;
  return false;
}

/**
 * Personas isFeatured para /tres-argentinos.
 * Preferí GET /public/people/featured.
 */
export function selectFeaturedForUi(featuredItems) {
  const list = Array.isArray(featuredItems) ? featuredItems : [];
  if (list.length === 0) return null;

  return [...list]
    .filter((p) => p.isFeatured || isFeaturedOnly(p))
    .sort(
      (a, b) =>
        (a.featuredDisplayOrder ?? 999) - (b.featuredDisplayOrder ?? 999),
    )
    .map((p) => {
      const tr =
        p.translation ||
        p.translations?.find((t) => t.locale === "es") ||
        p.translations?.[0];
      const img =
        p.images?.find((i) => i.isPrimary) || p.images?.[0] || p.primaryImage;
      const media = img?.media || img;
      let foto = media?.url || null;
      if (!foto && media?.storageKey) {
        const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duuwqmpmn";
        foto = `https://res.cloudinary.com/${cloud}/image/upload/${media.storageKey}`;
      }
      foto = optimizeCloudinaryUrl(foto, 480);
      return {
        id: p.id,
        nombre: tr?.displayName || "Sin nombre",
        rol: cleanLegacyTag(tr?.shortBio) || cleanLegacyTag(tr?.biography) || "",
        foto,
        source: "api",
      };
    });
}

/**
 * Lista para /santos.
 * Preferí GET /public/people/holiness.
 * Siempre excluye isFeatured sin etapa de canonización (van a /tres-argentinos).
 */
export function selectSantosForUi(publicItems, { fromHoliness = false } = {}) {
  const list = Array.isArray(publicItems) ? publicItems : [];
  if (list.length === 0) {
    return SANTOS_BEATOS.map((s) => ({ ...s, source: "local", apiId: null }));
  }

  const withoutFeatured = list.filter((p) => !isFeaturedOnly(p));
  const source = fromHoliness
    ? withoutFeatured
    : withoutFeatured.filter(isSantosCandidate);
  const effective = source.length > 0 ? source : withoutFeatured;

  return effective
    .map((p, i) => personToSanto(p, i))
    .sort((a, b) => Number(a.id) - Number(b.id));
}
