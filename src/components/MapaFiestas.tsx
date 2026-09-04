import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import fiestasData from "../data/fiestas.json" with { type: "json" };
import { capituloLabel, clusterFiestas } from "../lib/geo";
import type { Cluster, Fiesta, FiestaActiva, TipoFiesta } from "../lib/types";

const FIESTAS = fiestasData as Fiesta[];
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const ARG_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-78, -58],
  [-48, -18],
];

const REGIONES = ["todas", ...[...new Set(FIESTAS.map((f) => f.region))]];
const TIPOS: Array<{ id: "todos" | TipoFiesta; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "fija", label: "Lugar puntual" },
  { id: "movil", label: "Fiesta móvil" },
  { id: "nacional", label: "En todo el país" },
  { id: "pendiente", label: "Próximas a visitar" },
];
const MESES = ["todos", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MES_NOMBRE = [
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

function idsDe(activa: FiestaActiva): number[] {
  if (activa == null) return [];
  return Array.isArray(activa) ? activa : [activa];
}

function coincide(f: Fiesta, region: string, tipo: string, mes: string, q: string) {
  if (region !== "todas" && f.region !== region) return false;
  if (tipo !== "todos" && f.tipo !== tipo) return false;
  if (mes !== "todos" && String(f.mes) !== mes) return false;
  if (q) {
    const hay = `${f.nombre} ${f.lugar} ${f.provincia} ${f.id}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  return true;
}

function Detalle({ fiestas, onPick }: { fiestas: Fiesta[]; onPick: (id: number) => void }) {
  if (!fiestas.length) {
    return (
      <p className="text-sm">
        Elegí un pin en el mapa o una fiesta de la lista para ver el detalle.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {fiestas.map((f) => {
        const cap = capituloLabel(f.capitulo);
        return (
          <li key={f.id} className="border border-azul-logo/30 p-3">
            <button type="button" className="w-full text-left" onClick={() => onPick(f.id)}>
              <p className="font-display text-lg text-azul-petroleo">
                <span className="mr-2 font-body text-sm">{String(f.id).padStart(2, "0")}</span>
                {f.nombre}
              </p>
              <p className="mt-1 text-sm">
                {f.lugar}
                {f.provincia && f.lugar !== f.provincia ? `, ${f.provincia}` : ""}
              </p>
              {f.fecha ? <p className="mt-1 text-sm">{f.fecha}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {cap ? (
                  <span className="bg-azul-petroleo px-2 py-0.5 text-xs text-blanco">{cap}</span>
                ) : null}
                {f.paginas ? (
                  <span className="border border-azul-logo px-2 py-0.5 text-xs">
                    Ver en el libro, pág. {f.paginas}
                  </span>
                ) : f.enLibro ? (
                  <span className="border border-azul-logo px-2 py-0.5 text-xs">En el libro</span>
                ) : (
                  <span className="border border-naranja-libro px-2 py-0.5 text-xs text-naranja-libro">
                    Próximamente
                  </span>
                )}
                {f.tipo === "movil" ? (
                  <span className="border border-dashed border-azul-petroleo px-2 py-0.5 text-xs">
                    Fiesta móvil
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Pin({
  cluster,
  active,
  onClick,
}: {
  cluster: Cluster;
  active: boolean;
  onClick: () => void;
}) {
  const pendiente = cluster.fiestas.every((f) => f.tipo === "pendiente");
  const movil = cluster.fiestas.every((f) => f.tipo === "movil") && !pendiente;
  const count = cluster.fiestas.length;
  const cls = [
    "map-pin",
    count > 1 ? "is-lg" : "",
    active ? "is-active" : "",
    movil ? "is-movil" : "",
    pendiente ? "is-pendiente" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      aria-label={cluster.fiestas.map((f) => f.nombre).join(", ")}
    >
      {count > 1 ? count : ""}
    </button>
  );
}

type Props = {
  fiestaActiva: FiestaActiva;
  onActiva: (value: FiestaActiva) => void;
};

export function MapaFiestas({ fiestaActiva, onActiva }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [region, setRegion] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [mes, setMes] = useState("todos");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (fiestaActiva != null) setSheet(true);
  }, [fiestaActiva]);

  const filtradas = useMemo(
    () => FIESTAS.filter((f) => coincide(f, region, tipo, mes, q)),
    [region, tipo, mes, q],
  );
  const nacionales = filtradas.filter((f) => f.tipo === "nacional");
  const clusters = useMemo(() => clusterFiestas(filtradas), [filtradas]);
  const activaIds = idsDe(fiestaActiva);
  const detalle = FIESTAS.filter((f) => activaIds.includes(f.id));

  useEffect(() => {
    const ids = idsDe(fiestaActiva);
    const f = FIESTAS.find((x) => ids.includes(x.id) && x.lat != null && x.lng != null);
    const map = mapRef.current;
    if (!f || f.lat == null || f.lng == null || !map) return;
    map.flyTo({
      center: [f.lng, f.lat],
      zoom: Math.max(map.getZoom(), 6.2),
      duration: 900,
    });
  }, [fiestaActiva]);

  function clickCluster(c: Cluster) {
    const ids = c.fiestas.map((f) => f.id);
    onActiva(ids.length === 1 ? ids[0] : ids);
    setSheet(true);
  }

  function clickLista(f: Fiesta) {
    onActiva(f.id);
    setSheet(true);
  }

  function verArgentina() {
    mapRef.current?.fitBounds(
      [
        [-73.6, -55.3],
        [-53.5, -21.7],
      ],
      { padding: 40, duration: 800 },
    );
  }

  return (
    <div className="bg-blanco px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="max-w-3xl font-light leading-relaxed">
          95 celebraciones relevadas por Federico Lanati. Las 82 primeras están fotografiadas en el
          libro; las 13 últimas son fiestas que el autor intentará visitar. Podés acercar, alejar y
          mover el mapa.
        </p>

        {nacionales.length > 0 ? (
          <div className="mt-6">
            <p className="font-display text-sm text-azul-petroleo">En todo el país</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {nacionales.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => clickLista(f)}
                  className={`shrink-0 border px-3 py-2 text-left text-sm ${
                    activaIds.includes(f.id)
                      ? "border-naranja-libro bg-papel text-azul-petroleo"
                      : "border-naranja-libro/50"
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-naranja-libro text-[11px] text-blanco">
                    {f.id}
                  </span>
                  {f.nombre}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            Buscar
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
              placeholder="Nombre, lugar, número…"
            />
          </label>
          <label className="text-sm">
            Región
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
            >
              {REGIONES.map((r) => (
                <option key={r} value={r}>
                  {r === "todas" ? "Todas" : r}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
            >
              {TIPOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Mes
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
            >
              {MESES.map((m) => (
                <option key={m} value={m}>
                  {m === "todos" ? "Todos" : MES_NOMBRE[Number(m)]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="bg-papel p-2 md:p-3">
            <div className="mapa-libre relative">
              <Map
                ref={mapRef}
                mapStyle={STYLE}
                initialViewState={{ longitude: -64.8, latitude: -40.2, zoom: 3.5 }}
                maxBounds={ARG_MAX_BOUNDS}
                cooperativeGestures
                attributionControl
                style={{ width: "100%", height: "100%" }}
                onLoad={verArgentina}
              >
                <NavigationControl position="top-right" showCompass={false} />
                {clusters.map((c) => (
                  <Marker key={c.key} longitude={c.lng} latitude={c.lat} anchor="center">
                    <Pin
                      cluster={c}
                      active={c.fiestas.some((f) => activaIds.includes(f.id))}
                      onClick={() => clickCluster(c)}
                    />
                  </Marker>
                ))}
              </Map>
              <button
                type="button"
                onClick={verArgentina}
                className="absolute bottom-8 left-2 bg-blanco px-3 py-1.5 text-xs text-azul-petroleo"
              >
                Ver todo el país
              </button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-azul-petroleo" /> Lugar
                puntual
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-azul-petroleo" />{" "}
                Fiesta móvil
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-azul-petroleo bg-transparent" />{" "}
                Próxima a visitar
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-naranja-libro" /> En todo el
                país
              </li>
            </ul>
          </div>

          <div className="flex min-h-[420px] flex-col border border-azul-logo/20">
            <div className="border-b border-azul-logo/20 px-3 py-2 text-sm">
              {filtradas.length} fiestas
            </div>
            <div className="max-h-[280px] overflow-y-auto lg:max-h-[360px]">
              <ul>
                {filtradas.map((f) => {
                  const active = activaIds.includes(f.id);
                  return (
                    <li key={f.id} className="border-b border-azul-logo/10">
                      <button
                        type="button"
                        onClick={() => clickLista(f)}
                        className={`flex w-full items-start gap-3 px-3 py-2 text-left ${
                          active ? "bg-papel" : ""
                        }`}
                      >
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
                        <span>
                          <span className="block text-sm font-medium text-azul-petroleo">
                            {f.nombre}
                          </span>
                          <span className="block text-xs">
                            {f.lugar}
                            {f.fecha ? ` · ${f.fecha}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="hidden flex-1 overflow-y-auto border-t border-azul-logo/20 p-3 lg:block">
              <Detalle fiestas={detalle} onPick={(id) => onActiva(id)} />
            </div>
          </div>
        </div>
      </div>

      {sheet && detalle.length > 0 ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-azul-petroleo/45"
            aria-label="Cerrar detalle"
            onClick={() => setSheet(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-y-auto border-t-4 border-azul-petroleo bg-blanco px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-azul-petroleo">Detalle</p>
              <button type="button" className="text-sm" onClick={() => setSheet(false)}>
                Cerrar
              </button>
            </div>
            <Detalle fiestas={detalle} onPick={(id) => onActiva(id)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
