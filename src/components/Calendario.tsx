import fiestasData from "../data/fiestas.json" with { type: "json" };
import type { Fiesta, FiestaActiva } from "../lib/types";

const FIESTAS = fiestasData as Fiesta[];
const MESES = [
  { n: 1, nombre: "Enero" },
  { n: 2, nombre: "Febrero" },
  { n: 3, nombre: "Marzo" },
  { n: 4, nombre: "Abril" },
  { n: 5, nombre: "Mayo" },
  { n: 6, nombre: "Junio" },
  { n: 7, nombre: "Julio" },
  { n: 8, nombre: "Agosto" },
  { n: 9, nombre: "Septiembre" },
  { n: 10, nombre: "Octubre" },
  { n: 11, nombre: "Noviembre" },
  { n: 12, nombre: "Diciembre" },
];

function idsDe(activa: FiestaActiva): number[] {
  if (activa == null) return [];
  return Array.isArray(activa) ? activa : [activa];
}

type Props = {
  fiestaActiva: FiestaActiva;
  onActiva: (id: number) => void;
};

export function Calendario({ fiestaActiva, onActiva }: Props) {
  const activaIds = idsDe(fiestaActiva);
  const enLibro = FIESTAS.filter((f) => f.enLibro);
  const pendientes = FIESTAS.filter((f) => !f.enLibro);
  const sinMes = enLibro.filter((f) => f.mes == null);

  function elegir(id: number) {
    onActiva(id);
    document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div id="calendario" className="scroll-mt-16 bg-blanco px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h3 className="titulo-seccion text-[1.75rem] md:text-[2rem]">
          Calendario de las fiestas populares
        </h3>
        <p className="caption-en mt-1 text-sm">
          Calendar of the popular Argentine festivals surveyed by the author
        </p>
        <p className="mt-3 max-w-3xl font-light">
          Vista mes a mes, como en la página 30 del libro. Tocá una fiesta para resaltarla en el
          mapa.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {MESES.map((m) => {
            const items = enLibro.filter((f) => f.mes === m.n);
            return (
              <section key={m.n}>
                <h4 className="font-display text-lg uppercase tracking-wide text-azul-petroleo">
                  {m.nombre}
                </h4>
                <ul className="mt-3 flex flex-col gap-2">
                  {items.map((f) => {
                    const active = activaIds.includes(f.id);
                    const dia = f.fechaISO_referencia
                      ? f.fechaISO_referencia.slice(-2).replace(/^0/, "")
                      : f.tipo === "movil"
                        ? "<>"
                        : "·";
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => elegir(f.id)}
                          className={`ctrl-fila flex w-full items-start gap-2 text-left text-sm ${
                            active ? "is-on" : ""
                          }`}
                        >
                          <span className="w-7 shrink-0 pt-0.5 font-medium text-azul-logo">{dia}</span>
                          <span className="flex-1">
                            <span className="font-medium text-azul-petroleo">{f.nombre}</span>
                            <span className="block text-xs">
                              {f.lugar} ({f.provincia})
                            </span>
                          </span>
                          <span
                            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                              f.tipo === "nacional"
                                ? "bg-naranja-libro text-blanco"
                                : f.tipo === "pendiente"
                                  ? "border border-dashed border-azul-petroleo text-azul-petroleo"
                                  : "bg-azul-petroleo text-blanco"
                            }`}
                          >
                            {f.id}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {sinMes.length > 0 ? (
          <section className="mt-10">
            <h4 className="font-display text-lg uppercase tracking-wide text-azul-petroleo">
              Todo el año / sin mes fijo
            </h4>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {sinMes.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => elegir(f.id)}
                    className={`ctrl-fila flex w-full items-start gap-2 text-left text-sm ${
                      activaIds.includes(f.id) ? "is-on" : ""
                    }`}
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azul-petroleo text-[11px] text-blanco">
                      {f.id}
                    </span>
                    <span>
                      <span className="font-medium text-azul-petroleo">{f.nombre}</span>
                      <span className="block text-xs">
                        {f.lugar ? `${f.lugar}, ` : ""}
                        {f.provincia}
                        {f.fecha ? ` · ${f.fecha}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pendientes.length > 0 ? (
          <section className="mt-10">
            <h4 className="font-display text-lg uppercase tracking-wide text-azul-petroleo">
              Otras fiestas importantes que intentaremos visitar
            </h4>
            <p className="caption-en mt-1 text-sm">
              Other important celebrations that we will attend
            </p>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {pendientes.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => elegir(f.id)}
                    className={`ctrl-fila flex w-full items-start gap-2 text-left text-sm ${
                      activaIds.includes(f.id) ? "is-on" : ""
                    }`}
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-naranja-libro text-[11px] text-naranja-libro">
                      {f.id}
                    </span>
                    <span>
                      <span className="font-medium text-azul-petroleo">{f.nombre}</span>
                      <span className="block text-xs">
                        {f.lugar ? `${f.lugar}, ` : ""}
                        {f.provincia}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
