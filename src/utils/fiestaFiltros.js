/** Filtros compartidos mapa / galería — campos que el API público ya entrega. */

export const MESES = ["todos", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export const MES_NOMBRE = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Leyenda del mapa (referencia anterior). */
export const TIPOS_MAPA = [
  { id: "todos", label: "Todos" },
  { id: "fija", label: "Lugar puntual" },
  { id: "movil", label: "Fiesta móvil" },
  { id: "pendiente", label: "Próxima a visitar" },
  { id: "nacional", label: "En todo el país" },
];

export const TIPO_LABEL = {
  fija: "Lugar puntual",
  movil: "Fiesta móvil",
  pendiente: "Próxima a visitar",
  nacional: "En todo el país",
};

export function clasePin(tipo) {
  return (
    {
      movil: "is-movil",
      pendiente: "is-pendiente",
      nacional: "is-nacional",
    }[tipo] || ""
  );
}

/** Círculo de la lista, mismo criterio que el pin. */
export function claseNumero(tipo) {
  return (
    {
      movil: "border border-azul-petroleo bg-blanco text-azul-petroleo",
      pendiente: "border border-dashed border-azul-petroleo bg-blanco text-azul-petroleo",
      nacional: "bg-naranja-libro text-blanco",
    }[tipo] || "bg-azul-petroleo text-blanco"
  );
}

export function provinciasDe(fiestas) {
  return [
    "todas",
    ...[...new Set(fiestas.map((f) => f.provincia).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
  ];
}

/** Meses que aparecen en el set (solo los que tienen al menos una fiesta). */
export function mesesDe(fiestas) {
  const set = new Set();
  for (const f of fiestas) {
    if (f.mes != null && f.mes !== "") set.add(String(f.mes));
  }
  return ["todos", ...[...set].sort((a, b) => Number(a) - Number(b))];
}

/**
 * @param {object} f fiesta adaptada
 * @param {{ provincia?: string, tipo?: string, mes?: string, q?: string }} filtros
 */
export function coincideFiltro(f, { provincia = "todas", tipo = "todos", mes = "todos", q = "" }) {
  if (provincia !== "todas" && f.provincia !== provincia) return false;
  if (tipo !== "todos" && f.tipo !== tipo) return false;
  if (mes !== "todos") {
    // Fiestas móviles / sin mes no entran al filtro por mes concreto
    if (f.mes == null || String(f.mes) !== mes) return false;
  }
  if (q) {
    const n = f.numero != null ? f.numero : f.id;
    const hay = `${f.nombre} ${f.lugar} ${f.provincia} ${n}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  return true;
}

export function filtrosActivos({ provincia = "todas", tipo = "todos", mes = "todos", q = "" }) {
  return provincia !== "todas" || tipo !== "todos" || mes !== "todos" || Boolean(q?.trim());
}
