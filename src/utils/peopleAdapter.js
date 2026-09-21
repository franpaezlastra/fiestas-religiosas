import { SANTOS_BEATOS } from "../data/santos";

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

function displayNumberOf(person, index) {
  const fromBook = person.bookAssociations?.[0]?.displayNumber;
  if (fromBook != null) return Number(fromBook);
  if (person.featuredDisplayOrder != null) return Number(person.featuredDisplayOrder);
  if (person.roles?.[0]?.displayOrder != null) return Number(person.roles[0].displayOrder);
  return index + 1;
}

/**
 * Persona pública API → shape de SeccionSantos.
 * shortBio puede guardar legacySantosId:N cuando viene del seed.
 */
export function personToSanto(person, index = 0) {
  const tr =
    person.translation ||
    person.translations?.find((t) => t.locale === "es") ||
    person.translations?.[0];
  const legacy = String(tr?.shortBio || "").match(/legacySantosId:(\d+)/i);
  const id = legacy ? Number(legacy[1]) : displayNumberOf(person, index);
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

  return {
    id,
    apiId: person.id,
    nombre: tr?.displayName || local?.nombre || "Sin nombre",
    anios,
    categoria,
    lugar: tr?.birthPlace || local?.lugar || "",
    provincia: local?.provincia || "",
    bio: tr?.biography || local?.bio || tr?.shortBio || "",
    source: "api",
  };
}

function isSantosCandidate(p) {
  if (p.canonizationStage) return true;
  if (p.isFeatured) return true;
  return (p.roles || []).some((r) =>
    ["SAINT", "BLESSED", "FEATURED_PERSON"].includes(r.role),
  );
}

export function selectSantosForUi(publicItems) {
  const list = Array.isArray(publicItems) ? publicItems : [];
  if (list.length === 0) {
    return SANTOS_BEATOS.map((s) => ({ ...s, source: "local", apiId: null }));
  }

  const filtered = list.filter(isSantosCandidate);
  const source = filtered.length > 0 ? filtered : list;

  return source
    .map((p, i) => personToSanto(p, i))
    .sort((a, b) => Number(a.id) - Number(b.id));
}
