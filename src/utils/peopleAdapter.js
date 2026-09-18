import { SANTOS_BEATOS } from "../data/santos";

const LOCAL_BY_ID = new Map(SANTOS_BEATOS.map((s) => [s.id, s]));

/**
 * Persona pública API → shape de SeccionSantos.
 * shortBio guarda legacySantosId:N cuando viene del seed.
 */
export function personToSanto(person, index = 0) {
  const tr =
    person.translation ||
    person.translations?.find((t) => t.locale === "es") ||
    person.translations?.[0];
  const legacy = String(tr?.shortBio || "").match(/legacySantosId:(\d+)/i);
  const id = legacy
    ? Number(legacy[1])
    : person.roles?.[0]?.displayOrder || index + 1;
  const local = LOCAL_BY_ID.get(id);

  const role = person.roles?.[0]?.role;
  let categoria = local?.categoria || "beato";
  if (role === "SAINT") categoria = "santo";
  else if (role === "BLESSED") categoria = "beato";
  else if (role === "FEATURED_PERSON") categoria = "siervo";

  const birth = person.birthDate ? String(person.birthDate).slice(0, 4) : "";
  const death = person.deathDate ? String(person.deathDate).slice(0, 4) : "";
  const anios =
    birth && death
      ? `${birth}-${death}`
      : birth
        ? `${birth}-`
        : local?.anios || "";

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

export function selectSantosForUi(publicItems) {
  const list = Array.isArray(publicItems) ? publicItems : [];
  if (list.length === 0) {
    return SANTOS_BEATOS.map((s) => ({ ...s, source: "local", apiId: null }));
  }

  const withRole = list.filter((p) =>
    (p.roles || []).some((r) =>
      ["SAINT", "BLESSED", "FEATURED_PERSON"].includes(r.role),
    ),
  );
  const source = withRole.length > 0 ? withRole : list;

  return source
    .map((p, i) => personToSanto(p, i))
    .sort((a, b) => Number(a.id) - Number(b.id));
}
